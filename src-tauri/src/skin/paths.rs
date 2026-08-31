use std::path::PathBuf;

#[derive(Debug, Clone)]
pub struct SkinPaths {
    pub bundled_root: PathBuf,
    pub user_root: PathBuf,
}

impl SkinPaths {
    pub fn new(bundled_root: PathBuf, user_root: PathBuf) -> Self {
        Self {
            bundled_root,
            user_root,
        }
    }

    pub fn bundled_skin_dir(&self, skin_id: &str) -> PathBuf {
        let candidate = self.bundled_root.join(skin_id);
        if candidate.parent() == Some(self.bundled_root.as_path()) {
            candidate
        } else {
            self.bundled_root.join("_invalid")
        }
    }

    pub fn user_skin_dir(&self, skin_id: &str) -> PathBuf {
        self.user_root.join(skin_id)
    }
}

#[cfg(test)]
pub fn fixture_bundled_root() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("skins")
}

#[cfg(test)]
pub fn source_tree_paths() -> SkinPaths {
    SkinPaths::new(
        fixture_bundled_root(),
        std::env::temp_dir().join("workbuddy-test-user-skins"),
    )
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::skin::compiler::compile;
    use crate::skin::manager::get_builtin_skins;
    use std::fs;
    use std::path::Path;

    fn copy_jingtian(src: &Path, dst: &Path) {
        fs::create_dir_all(dst.join("assets")).unwrap();
        for rel in [
            "theme.css",
            "assets/wall.webp",
            "assets/jingtian-home.webp",
            "assets/jingtian-chat.webp",
        ] {
            fs::copy(src.join(rel), dst.join(rel)).unwrap_or_else(|e| {
                panic!("copy {rel}: {e}");
            });
        }
        let mut css = fs::read_to_string(dst.join("theme.css")).unwrap();
        css.push_str("\n/* bundled-root-marker */\n");
        fs::write(dst.join("theme.css"), css).unwrap();
    }

    #[test]
    fn bundled_skin_dir_stays_inside_root() {
        let paths = SkinPaths::new(PathBuf::from("/tmp/skins"), PathBuf::from("/tmp/user"));
        assert_eq!(
            paths.bundled_skin_dir("jingtian-starlight"),
            PathBuf::from("/tmp/skins/jingtian-starlight")
        );
        assert_eq!(
            paths.bundled_skin_dir("../outside"),
            PathBuf::from("/tmp/skins/_invalid")
        );
    }

    #[test]
    fn compile_jingtian_from_injected_bundled_root() {
        let src = fixture_bundled_root().join("jingtian-starlight");
        let bundled_root =
            std::env::temp_dir().join(format!("wb-bundled-skins-{}", std::process::id()));
        let user_root = bundled_root.join("user");
        let dst = bundled_root.join("jingtian-starlight");
        let _ = fs::remove_dir_all(&bundled_root);
        copy_jingtian(&src, &dst);

        let paths = SkinPaths::new(bundled_root.clone(), user_root);
        let skin = get_builtin_skins(&paths)
            .into_iter()
            .find(|s| s.manifest.id == "jingtian-starlight")
            .expect("jingtian builtin");

        let source = skin.source_path.as_ref().expect("bundled source_path");
        assert!(
            Path::new(source).starts_with(&bundled_root),
            "source_path {source} is not under injected bundled_root"
        );
        assert!(
            !source.contains(env!("CARGO_MANIFEST_DIR")),
            "source_path leaked developer manifest dir: {source}"
        );

        let compiled = compile(&skin, &paths).unwrap();
        assert!(compiled.css.contains("bundled-root-marker"));
        assert!(!compiled.css.contains(env!("CARGO_MANIFEST_DIR")));
        assert!(compiled.stage.is_some());

        let _ = fs::remove_dir_all(&bundled_root);
    }
}
