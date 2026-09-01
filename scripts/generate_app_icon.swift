import AppKit
import CoreGraphics
import Foundation

func createMinimalistModernIcon(size: CGFloat) -> NSImage {
    let image = NSImage(size: NSSize(width: size, height: size))
    image.lockFocus()
    
    guard let ctx = NSGraphicsContext.current?.cgContext else {
        image.unlockFocus()
        return image
    }
    
    let rect = CGRect(x: 0, y: 0, width: size, height: size)
    let pad = size * 0.085
    let iconRect = rect.insetBy(dx: pad, dy: pad)
    let cornerRadius = iconRect.width * 0.225
    
    let path = CGPath(roundedRect: iconRect, cornerWidth: cornerRadius, cornerHeight: cornerRadius, transform: nil)
    
    // 1. 绘制底部大厂级柔和拟物阴影
    ctx.saveGState()
    ctx.setShadow(
        offset: CGSize(width: 0, height: -size * 0.035),
        blur: size * 0.06,
        color: CGColor(red: 0.0, green: 0.0, blue: 0.0, alpha: 0.45)
    )
    ctx.addPath(path)
    ctx.setFillColor(CGColor(red: 0.07, green: 0.09, blue: 0.14, alpha: 1.0))
    ctx.fillPath()
    ctx.restoreGState()
    
    // 裁剪进入图标内部
    ctx.saveGState()
    ctx.addPath(path)
    ctx.clip()
    
    let colorSpace = CGColorSpaceCreateDeviceRGB()
    
    // 2. 底座背景：高级深空金属渐变 (Deep Slate Obsidian)
    let bgColors = [
        CGColor(red: 0.12, green: 0.14, blue: 0.20, alpha: 1.0), // 顶部冷灰
        CGColor(red: 0.07, green: 0.08, blue: 0.13, alpha: 1.0), // 中间深蓝灰
        CGColor(red: 0.04, green: 0.05, blue: 0.08, alpha: 1.0)  // 底部黑曜石
    ] as CFArray
    if let bgGradient = CGGradient(colorsSpace: colorSpace, colors: bgColors, locations: [0.0, 0.5, 1.0]) {
        ctx.drawLinearGradient(
            bgGradient,
            start: CGPoint(x: iconRect.midX, y: iconRect.maxY),
            end: CGPoint(x: iconRect.midX, y: iconRect.minY),
            options: []
        )
    }
    
    // 3. 顶部柔和环境微光 (Top Ambient Diffuse)
    let ambientColors = [
        CGColor(red: 0.35, green: 0.45, blue: 0.85, alpha: 0.18),
        CGColor(red: 0.1, green: 0.1, blue: 0.2, alpha: 0.0)
    ] as CFArray
    if let ambGradient = CGGradient(colorsSpace: colorSpace, colors: ambientColors, locations: [0.0, 1.0]) {
        ctx.drawRadialGradient(
            ambGradient,
            startCenter: CGPoint(x: iconRect.midX, y: iconRect.maxY),
            startRadius: 0,
            endCenter: CGPoint(x: iconRect.midX, y: iconRect.maxY),
            endRadius: iconRect.width * 0.7,
            options: []
        )
    }
    
    // 4. 绘制核心标志：纯粹极简的「极光换肤棱镜 (Aura Prism W)」
    // 由三个几何晶体多边形构成立体的「W/蝴蝶/调色羽翼」
    let cx = iconRect.midX
    let cy = iconRect.midY - size * 0.01
    let scale = iconRect.width * 0.0016
    
    func pt(_ x: CGFloat, _ y: CGFloat) -> CGPoint {
        return CGPoint(x: cx + x * scale, y: cy + y * scale)
    }
    
    // 4.1 背景环境辉光
    ctx.saveGState()
    ctx.setShadow(
        offset: .zero,
        blur: size * 0.12,
        color: CGColor(red: 0.38, green: 0.35, blue: 0.95, alpha: 0.45)
    )
    let glowCenter = CGRect(x: cx - size * 0.15, y: cy - size * 0.15, width: size * 0.3, height: size * 0.3)
    ctx.fillEllipse(in: glowCenter)
    ctx.restoreGState()
    
    // 4.2 左翼 (科技蓝青色晶片)
    let leftWing = CGMutablePath()
    leftWing.move(to: pt(-150, 70))
    leftWing.addCurve(to: pt(-30, 140), control1: pt(-130, 130), control2: pt(-70, 150))
    leftWing.addLine(to: pt(0, 0))
    leftWing.addLine(to: pt(-70, -110))
    leftWing.addCurve(to: pt(-150, 70), control1: pt(-140, -60), control2: pt(-160, 20))
    leftWing.closeSubpath()
    
    ctx.saveGState()
    ctx.setShadow(offset: CGSize(width: -2, height: -4), blur: size * 0.03, color: CGColor(red: 0.0, green: 0.5, blue: 1.0, alpha: 0.35))
    ctx.addPath(leftWing)
    ctx.clip()
    let leftColors = [
        CGColor(red: 0.0, green: 0.85, blue: 1.0, alpha: 0.95),  // 亮青
        CGColor(red: 0.0, green: 0.40, blue: 0.98, alpha: 0.95)  // 腾讯蓝
    ] as CFArray
    if let leftGrad = CGGradient(colorsSpace: colorSpace, colors: leftColors, locations: [0.0, 1.0]) {
        ctx.drawLinearGradient(leftGrad, start: pt(-140, 120), end: pt(0, -90), options: [])
    }
    ctx.restoreGState()
    
    // 4.3 右翼 (星蝶紫粉色晶片)
    let rightWing = CGMutablePath()
    rightWing.move(to: pt(150, 70))
    rightWing.addCurve(to: pt(30, 140), control1: pt(130, 130), control2: pt(70, 150))
    rightWing.addLine(to: pt(0, 0))
    rightWing.addLine(to: pt(70, -110))
    rightWing.addCurve(to: pt(150, 70), control1: pt(140, -60), control2: pt(160, 20))
    rightWing.closeSubpath()
    
    ctx.saveGState()
    ctx.setShadow(offset: CGSize(width: 2, height: -4), blur: size * 0.03, color: CGColor(red: 0.6, green: 0.2, blue: 1.0, alpha: 0.35))
    ctx.addPath(rightWing)
    ctx.clip()
    let rightColors = [
        CGColor(red: 0.95, green: 0.30, blue: 0.75, alpha: 0.95), // 瑰丽粉
        CGColor(red: 0.45, green: 0.22, blue: 0.95, alpha: 0.95)  // 星蝶紫
    ] as CFArray
    if let rightGrad = CGGradient(colorsSpace: colorSpace, colors: rightColors, locations: [0.0, 1.0]) {
        ctx.drawLinearGradient(rightGrad, start: pt(140, 120), end: pt(0, -90), options: [])
    }
    ctx.restoreGState()
    
    // 4.4 中央通透水晶棱镜 (Center Glass Prism)
    let centerPrism = CGMutablePath()
    centerPrism.move(to: pt(0, 120))
    centerPrism.addLine(to: pt(50, 0))
    centerPrism.addLine(to: pt(0, -130))
    centerPrism.addLine(to: pt(-50, 0))
    centerPrism.closeSubpath()
    
    ctx.saveGState()
    ctx.setShadow(offset: CGSize(width: 0, height: -2), blur: size * 0.025, color: CGColor(red: 0.0, green: 0.0, blue: 0.0, alpha: 0.3))
    ctx.addPath(centerPrism)
    ctx.clip()
    let prismColors = [
        CGColor(red: 1.0, green: 1.0, blue: 1.0, alpha: 0.85),
        CGColor(red: 0.80, green: 0.85, blue: 1.0, alpha: 0.45),
        CGColor(red: 0.45, green: 0.35, blue: 0.95, alpha: 0.65)
    ] as CFArray
    if let prismGrad = CGGradient(colorsSpace: colorSpace, colors: prismColors, locations: [0.0, 0.4, 1.0]) {
        ctx.drawLinearGradient(prismGrad, start: pt(0, 120), end: pt(0, -130), options: [])
    }
    ctx.restoreGState()
    
    // 4.5 晶棱高光描边 (Specular Edge)
    ctx.saveGState()
    ctx.addPath(centerPrism)
    ctx.setLineWidth(size * 0.003 + 1.0)
    ctx.setStrokeColor(CGColor(red: 1.0, green: 1.0, blue: 1.0, alpha: 0.55))
    ctx.strokePath()
    ctx.restoreGState()
    
    // 4.6 中心极小纯白高光星点 (Subtle Pure White Glint)
    ctx.saveGState()
    ctx.setShadow(offset: .zero, blur: size * 0.02, color: CGColor(red: 1.0, green: 1.0, blue: 1.0, alpha: 0.9))
    let glintRect = CGRect(x: cx - size * 0.012, y: cy + size * 0.015, width: size * 0.024, height: size * 0.024)
    ctx.setFillColor(CGColor(red: 1.0, green: 1.0, blue: 1.0, alpha: 1.0))
    ctx.fillEllipse(in: glintRect)
    ctx.restoreGState()
    
    ctx.restoreGState() // 结束内部裁剪
    
    // 5. 绘制外边缘精致内嵌高光描边 (Inner Rim Light)
    ctx.saveGState()
    let borderPath = CGPath(roundedRect: iconRect.insetBy(dx: 0.75, dy: 0.75), cornerWidth: cornerRadius, cornerHeight: cornerRadius, transform: nil)
    ctx.addPath(borderPath)
    ctx.setLineWidth(size * 0.0025 + 1.0)
    ctx.setStrokeColor(CGColor(red: 1.0, green: 1.0, blue: 1.0, alpha: 0.12))
    ctx.strokePath()
    ctx.restoreGState()
    
    image.unlockFocus()
    return image
}

func savePNG(image: NSImage, targetPath: String, width: Int, height: Int) {
    let rep = NSBitmapImageRep(
        bitmapDataPlanes: nil,
        pixelsWide: width,
        pixelsHigh: height,
        bitsPerSample: 8,
        samplesPerPixel: 4,
        hasAlpha: true,
        isPlanar: false,
        colorSpaceName: .deviceRGB,
        bytesPerRow: 0,
        bitsPerPixel: 0
    )!
    
    NSGraphicsContext.saveGraphicsState()
    let ctx = NSGraphicsContext(bitmapImageRep: rep)
    NSGraphicsContext.current = ctx
    
    image.draw(
        in: NSRect(x: 0, y: 0, width: width, height: height),
        from: NSRect(origin: .zero, size: image.size),
        operation: .copy,
        fraction: 1.0
    )
    
    NSGraphicsContext.restoreGraphicsState()
    
    if let data = rep.representation(using: .png, properties: [:]) {
        try? data.write(to: URL(fileURLWithPath: targetPath))
    }
}

// 主执行流程
let fm = FileManager.default
let scriptDir = URL(fileURLWithPath: #file).deletingLastPathComponent().path
let rootDir = (scriptDir as NSString).deletingLastPathComponent
let iconsDir = "\(rootDir)/src-tauri/icons"
let iconsetDir = "\(rootDir)/src-tauri/icons/icon.iconset"

try? fm.createDirectory(atPath: iconsetDir, withIntermediateDirectories: true, attributes: nil)

print("🎨 正在渲染极简科技极光 W-Aura 图标 (1024x1024)...")
let masterImage = createMinimalistModernIcon(size: 1024)

// 导出 1024x1024
savePNG(image: masterImage, targetPath: "\(iconsDir)/1024x1024.png", width: 1024, height: 1024)

// 导出 Tauri 标准尺寸
savePNG(image: masterImage, targetPath: "\(iconsDir)/icon.png", width: 512, height: 512)
savePNG(image: masterImage, targetPath: "\(iconsDir)/512x512.png", width: 512, height: 512)
savePNG(image: masterImage, targetPath: "\(iconsDir)/256x256.png", width: 256, height: 256)
savePNG(image: masterImage, targetPath: "\(iconsDir)/128x128@2x.png", width: 256, height: 256)
savePNG(image: masterImage, targetPath: "\(iconsDir)/128x128.png", width: 128, height: 128)
savePNG(image: masterImage, targetPath: "\(iconsDir)/32x32.png", width: 32, height: 32)

// 输出到 public/
let publicDir = "\(rootDir)/public"
try? fm.createDirectory(atPath: publicDir, withIntermediateDirectories: true, attributes: nil)
savePNG(image: masterImage, targetPath: "\(publicDir)/app-icon.png", width: 512, height: 512)
savePNG(image: masterImage, targetPath: "\(publicDir)/favicon.png", width: 64, height: 64)

// 导出 macOS iconset
let iconsetSizes: [(String, Int)] = [
    ("icon_16x16.png", 16),
    ("icon_16x16@2x.png", 32),
    ("icon_32x32.png", 32),
    ("icon_32x32@2x.png", 64),
    ("icon_128x128.png", 128),
    ("icon_128x128@2x.png", 256),
    ("icon_256x256.png", 256),
    ("icon_256x256@2x.png", 512),
    ("icon_512x512.png", 512),
    ("icon_512x512@2x.png", 1024)
]

for (filename, px) in iconsetSizes {
    savePNG(image: masterImage, targetPath: "\(iconsetDir)/\(filename)", width: px, height: px)
}

print("✅ 图标切图生成完成，正在打包 macOS .icns ...")
let task = Process()
task.launchPath = "/usr/bin/iconutil"
task.arguments = ["-c", "icns", iconsetDir, "-o", "\(iconsDir)/icon.icns"]
task.launch()
task.waitUntilExit()

try? fm.removeItem(atPath: iconsetDir)

print("🎉 极简高质感 App 图标生成完毕！已更新至 src-tauri/icons/ 与 public/")
