$ScriptDir = $PSScriptRoot
if (-not $ScriptDir) { $ScriptDir = (Get-Location).Path }
$jsonPath = Join-Path $ScriptDir "slides_data.json"
$OutputPath = Join-Path $ScriptDir "AgriConnect_Pitch_Deck_10_Slides.pptx"

$slidesData = Get-Content -Raw -Encoding UTF8 $jsonPath | ConvertFrom-Json

$tempDir = Join-Path $env:TEMP ("pptx_gen_" + [Guid]::NewGuid().ToString("N"))
New-Item -ItemType Directory -Path $tempDir -Force | Out-Null

$pptDir = Join-Path $tempDir "ppt"
$relsDir = Join-Path $tempDir "_rels"
$pptRelsDir = Join-Path $pptDir "_rels"
$slidesDir = Join-Path $pptDir "slides"
$slidesRelsDir = Join-Path $slidesDir "_rels"
$layoutsDir = Join-Path $pptDir "slideLayouts"
$layoutsRelsDir = Join-Path $layoutsDir "_rels"
$mastersDir = Join-Path $pptDir "slideMasters"
$mastersRelsDir = Join-Path $mastersDir "_rels"
$themeDir = Join-Path $pptDir "theme"

New-Item -ItemType Directory -Path $pptDir, $relsDir, $pptRelsDir, $slidesDir, $slidesRelsDir, $layoutsDir, $layoutsRelsDir, $mastersDir, $mastersRelsDir, $themeDir -Force | Out-Null

# 1. [Content_Types].xml
$contentTypes = @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>
  <Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/>
  <Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/>
  <Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>
"@

for ($i = 1; $i -le 10; $i++) {
    $contentTypes += @"
  <Override PartName="/ppt/slides/slide$i.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>
"@
}
$contentTypes += "</Types>"
[System.IO.File]::WriteAllText((Join-Path $tempDir "[Content_Types].xml"), $contentTypes, [System.Text.Encoding]::UTF8)

# 2. _rels/.rels
$rootRels = @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/>
</Relationships>
"@
[System.IO.File]::WriteAllText((Join-Path $relsDir ".rels"), $rootRels, [System.Text.Encoding]::UTF8)

# 3. ppt/theme/theme1.xml
$theme1 = @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="AgriConnect Eco Theme">
  <a:themeElements>
    <a:clrScheme name="AgriGreen">
      <a:dk1><a:srgbClr val="0F240D"/></a:dk1>
      <a:lt1><a:srgbClr val="FFFFFF"/></a:lt1>
      <a:dk2><a:srgbClr val="173F0C"/></a:dk2>
      <a:lt2><a:srgbClr val="F2FCE9"/></a:lt2>
      <a:accent1><a:srgbClr val="3BA117"/></a:accent1>
      <a:accent2><a:srgbClr val="22720D"/></a:accent2>
      <a:accent3><a:srgbClr val="FEF08A"/></a:accent3>
      <a:accent4><a:srgbClr val="CA8A04"/></a:accent4>
      <a:accent5><a:srgbClr val="0284C7"/></a:accent5>
      <a:accent6><a:srgbClr val="EF4444"/></a:accent6>
      <a:hlink><a:srgbClr val="256314"/></a:hlink>
      <a:folHlink><a:srgbClr val="1C560E"/></a:folHlink>
    </a:clrScheme>
    <a:fontScheme name="ModernEcoFonts">
      <a:majorFont><a:latin typeface="Montserrat"/><a:ea typeface=""/><a:cs typeface=""/></a:majorFont>
      <a:minorFont><a:latin typeface="Be Vietnam Pro"/><a:ea typeface=""/><a:cs typeface=""/></a:minorFont>
    </a:fontScheme>
    <a:fmtScheme name="Office">
      <a:fillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:fillStyleLst>
      <a:lnStyleLst><a:ln w="9525"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln><a:ln w="25400"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln><a:ln w="38100"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln></a:lnStyleLst>
      <a:effectStyleLst><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle></a:effectStyleLst>
      <a:bgFillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:bgFillStyleLst>
    </a:fmtScheme>
  </a:themeElements>
</a:theme>
"@
[System.IO.File]::WriteAllText((Join-Path $themeDir "theme1.xml"), $theme1, [System.Text.Encoding]::UTF8)

# 4. ppt/slideMasters/slideMaster1.xml
$slideMaster1 = @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldMaster xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld>
    <p:bg>
      <p:bgPr>
        <a:solidFill><a:srgbClr val="F7FDF3"/></a:solidFill>
      </p:bgPr>
    </p:bg>
    <p:spTree>
      <p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
      <p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>
    </p:spTree>
  </p:cSld>
  <p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/>
  <p:sldLayoutIdLst>
    <p:sldLayoutId id="2147483649" r:id="rId1"/>
  </p:sldLayoutIdLst>
  <p:txStyles>
    <p:titleStyle><a:lvl1pPr><a:defRPr sz="4000" b="1"><a:solidFill><a:srgbClr val="0F240D"/></a:solidFill></a:defRPr></a:lvl1pPr></p:titleStyle>
    <p:bodyStyle><a:lvl1pPr><a:defRPr sz="2000"><a:solidFill><a:srgbClr val="1F3813"/></a:solidFill></a:defRPr></a:lvl1pPr></p:bodyStyle>
    <p:otherStyle><a:lvl1pPr><a:defRPr sz="1600"/></a:lvl1pPr></p:otherStyle>
  </p:txStyles>
</p:sldMaster>
"@
[System.IO.File]::WriteAllText((Join-Path $mastersDir "slideMaster1.xml"), $slideMaster1, [System.Text.Encoding]::UTF8)

# ppt/slideMasters/_rels/slideMaster1.xml.rels
$masterRels = @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="../theme/theme1.xml"/>
</Relationships>
"@
[System.IO.File]::WriteAllText((Join-Path $mastersRelsDir "slideMaster1.xml.rels"), $masterRels, [System.Text.Encoding]::UTF8)

# 5. ppt/slideLayouts/slideLayout1.xml
$slideLayout1 = @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldLayout xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" type="blank" preserve="1">
  <p:cSld name="Blank Layout">
    <p:spTree>
      <p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
      <p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>
    </p:spTree>
  </p:cSld>
  <p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>
</p:sldLayout>
"@
[System.IO.File]::WriteAllText((Join-Path $layoutsDir "slideLayout1.xml"), $slideLayout1, [System.Text.Encoding]::UTF8)

# ppt/slideLayouts/_rels/slideLayout1.xml.rels
$layoutRels = @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="../slideMasters/slideMaster1.xml"/>
</Relationships>
"@
[System.IO.File]::WriteAllText((Join-Path $layoutsRelsDir "slideLayout1.xml.rels"), $layoutRels, [System.Text.Encoding]::UTF8)

# 6. ppt/presentation.xml & ppt/_rels/presentation.xml.rels
$presRels = @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rIdMaster1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="slideMasters/slideMaster1.xml"/>
"@

$presXml = @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:sldMasterIdLst>
    <p:sldMasterId id="2147483648" r:id="rIdMaster1"/>
  </p:sldMasterIdLst>
  <p:sldIdLst>
"@

for ($i = 1; $i -le 10; $i++) {
    $rId = "rIdSlide$i"
    $sldId = 255 + $i
    $presRels += @"
  <Relationship Id="$rId" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide$i.xml"/>
"@
    $presXml += @"
    <p:sldId id="$sldId" r:id="$rId"/>
"@
}

$presRels += "</Relationships>"
$presXml += @"
  </p:sldIdLst>
  <p:sldSz cx="12192000" cy="6858000" type="screen16x9"/>
  <p:notesSz cx="6858000" cy="9144000"/>
</p:presentation>
"@

[System.IO.File]::WriteAllText((Join-Path $pptRelsDir "presentation.xml.rels"), $presRels, [System.Text.Encoding]::UTF8)
[System.IO.File]::WriteAllText((Join-Path $pptDir "presentation.xml"), $presXml, [System.Text.Encoding]::UTF8)

# 7. Render 10 Slide XML
foreach ($s in $slidesData) {
    $num = $s.number
    $slideRel = @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>
</Relationships>
"@
    [System.IO.File]::WriteAllText((Join-Path $slidesRelsDir "slide$num.xml.rels"), $slideRel, [System.Text.Encoding]::UTF8)

    $c1 = $s.cards[0]
    $c2 = $s.cards[1]
    $c3 = $s.cards[2]

    $badgeEsc = [System.Security.SecurityElement]::Escape($s.badge)
    $titleEsc = [System.Security.SecurityElement]::Escape($s.title)
    $subEsc = [System.Security.SecurityElement]::Escape($s.subtitle)

    $c1TitleEsc = [System.Security.SecurityElement]::Escape($c1.title)
    $c1TextEsc = [System.Security.SecurityElement]::Escape($c1.text)
    $c2TitleEsc = [System.Security.SecurityElement]::Escape($c2.title)
    $c2TextEsc = [System.Security.SecurityElement]::Escape($c2.text)
    $c3TitleEsc = [System.Security.SecurityElement]::Escape($c3.title)
    $c3TextEsc = [System.Security.SecurityElement]::Escape($c3.text)

    $slideXml = @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld>
    <p:spTree>
      <p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
      <p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>
      
      <!-- Top Banner Tag -->
      <p:sp>
        <p:nvSpPr><p:cNvPr id="2" name="Badge"/><p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr><p:nvPr/></p:nvSpPr>
        <p:spPr>
          <a:xfrm><a:off x="800000" y="450000"/><a:ext cx="5200000" cy="400000"/></a:xfrm>
          <a:prstGeom prst="roundRect"><a:avLst><a:gd name="adj" fmla="val 25000"/></a:avLst></a:prstGeom>
          <a:solidFill><a:srgbClr val="E1F9CF"/></a:solidFill>
          <a:ln w="12700"><a:solidFill><a:srgbClr val="82D648"/></a:solidFill></a:ln>
        </p:spPr>
        <p:txBody>
          <a:bodyPr lIns="100000" tIns="50000" rIns="100000" bIns="50000" rtlCol="0" anchor="ctr"/>
          <a:lstStyle/>
          <a:p><a:pPr algn="ctr"/><a:r><a:rPr lang="vi-VN" sz="1100" b="1"><a:solidFill><a:srgbClr val="1C560E"/></a:solidFill></a:rPr><a:t>$badgeEsc</a:t></a:r></a:p>
        </p:txBody>
      </p:sp>

      <!-- Main Slide Title -->
      <p:sp>
        <p:nvSpPr><p:cNvPr id="3" name="Title"/><p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr><p:nvPr/></p:nvSpPr>
        <p:spPr>
          <a:xfrm><a:off x="800000" y="950000"/><a:ext cx="10500000" cy="700000"/></a:xfrm>
        </p:spPr>
        <p:txBody>
          <a:bodyPr lIns="0" tIns="0" rIns="0" bIns="0" rtlCol="0"/>
          <a:lstStyle/>
          <a:p><a:r><a:rPr lang="vi-VN" sz="2500" b="1"><a:solidFill><a:srgbClr val="0F240D"/></a:solidFill></a:rPr><a:t>$titleEsc</a:t></a:r></a:p>
        </p:txBody>
      </p:sp>

      <!-- Subtitle -->
      <p:sp>
        <p:nvSpPr><p:cNvPr id="4" name="Subtitle"/><p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr><p:nvPr/></p:nvSpPr>
        <p:spPr>
          <a:xfrm><a:off x="800000" y="1650000"/><a:ext cx="10500000" cy="400000"/></a:xfrm>
        </p:spPr>
        <p:txBody>
          <a:bodyPr lIns="0" tIns="0" rIns="0" bIns="0" rtlCol="0"/>
          <a:lstStyle/>
          <a:p><a:r><a:rPr lang="vi-VN" sz="1300" i="1"><a:solidFill><a:srgbClr val="2E7D14"/></a:solidFill></a:rPr><a:t>$subEsc</a:t></a:r></a:p>
        </p:txBody>
      </p:sp>

      <!-- Card 1 -->
      <p:sp>
        <p:nvSpPr><p:cNvPr id="5" name="Card1"/><p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr><p:nvPr/></p:nvSpPr>
        <p:spPr>
          <a:xfrm><a:off x="800000" y="2250000"/><a:ext cx="3300000" cy="3800000"/></a:xfrm>
          <a:prstGeom prst="roundRect"><a:avLst><a:gd name="adj" fmla="val 15000"/></a:avLst></a:prstGeom>
          <a:solidFill><a:srgbClr val="FFFFFF"/></a:solidFill>
          <a:ln w="19050"><a:solidFill><a:srgbClr val="B8EE99"/></a:solidFill></a:ln>
        </p:spPr>
        <p:txBody>
          <a:bodyPr lIns="200000" tIns="200000" rIns="200000" bIns="200000" rtlCol="0"/>
          <a:lstStyle/>
          <a:p><a:r><a:rPr lang="vi-VN" sz="1400" b="1"><a:solidFill><a:srgbClr val="1C560E"/></a:solidFill></a:rPr><a:t>$c1TitleEsc</a:t></a:r></a:p>
          <a:p><a:pPr marL="0" indent="0"/><a:endParaRPr sz="600"/></a:p>
          <a:p><a:r><a:rPr lang="vi-VN" sz="1200"><a:solidFill><a:srgbClr val="334155"/></a:solidFill></a:rPr><a:t>$c1TextEsc</a:t></a:r></a:p>
        </p:txBody>
      </p:sp>

      <!-- Card 2 -->
      <p:sp>
        <p:nvSpPr><p:cNvPr id="6" name="Card2"/><p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr><p:nvPr/></p:nvSpPr>
        <p:spPr>
          <a:xfrm><a:off x="4400000" y="2250000"/><a:ext cx="3300000" cy="3800000"/></a:xfrm>
          <a:prstGeom prst="roundRect"><a:avLst><a:gd name="adj" fmla="val 15000"/></a:avLst></a:prstGeom>
          <a:solidFill><a:srgbClr val="FFFFFF"/></a:solidFill>
          <a:ln w="19050"><a:solidFill><a:srgbClr val="3BA117"/></a:solidFill></a:ln>
        </p:spPr>
        <p:txBody>
          <a:bodyPr lIns="200000" tIns="200000" rIns="200000" bIns="200000" rtlCol="0"/>
          <a:lstStyle/>
          <a:p><a:r><a:rPr lang="vi-VN" sz="1400" b="1"><a:solidFill><a:srgbClr val="1C560E"/></a:solidFill></a:rPr><a:t>$c2TitleEsc</a:t></a:r></a:p>
          <a:p><a:pPr marL="0" indent="0"/><a:endParaRPr sz="600"/></a:p>
          <a:p><a:r><a:rPr lang="vi-VN" sz="1200"><a:solidFill><a:srgbClr val="334155"/></a:solidFill></a:rPr><a:t>$c2TextEsc</a:t></a:r></a:p>
        </p:txBody>
      </p:sp>

      <!-- Card 3 -->
      <p:sp>
        <p:nvSpPr><p:cNvPr id="7" name="Card3"/><p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr><p:nvPr/></p:nvSpPr>
        <p:spPr>
          <a:xfrm><a:off x="8000000" y="2250000"/><a:ext cx="3300000" cy="3800000"/></a:xfrm>
          <a:prstGeom prst="roundRect"><a:avLst><a:gd name="adj" fmla="val 15000"/></a:avLst></a:prstGeom>
          <a:solidFill><a:srgbClr val="FFFFFF"/></a:solidFill>
          <a:ln w="19050"><a:solidFill><a:srgbClr val="B8EE99"/></a:solidFill></a:ln>
        </p:spPr>
        <p:txBody>
          <a:bodyPr lIns="200000" tIns="200000" rIns="200000" bIns="200000" rtlCol="0"/>
          <a:lstStyle/>
          <a:p><a:r><a:rPr lang="vi-VN" sz="1400" b="1"><a:solidFill><a:srgbClr val="1C560E"/></a:solidFill></a:rPr><a:t>$c3TitleEsc</a:t></a:r></a:p>
          <a:p><a:pPr marL="0" indent="0"/><a:endParaRPr sz="600"/></a:p>
          <a:p><a:r><a:rPr lang="vi-VN" sz="1200"><a:solidFill><a:srgbClr val="334155"/></a:solidFill></a:rPr><a:t>$c3TextEsc</a:t></a:r></a:p>
        </p:txBody>
      </p:sp>

      <!-- Bottom Footer -->
      <p:sp>
        <p:nvSpPr><p:cNvPr id="8" name="Footer"/><p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr><p:nvPr/></p:nvSpPr>
        <p:spPr>
          <a:xfrm><a:off x="800000" y="6300000"/><a:ext cx="10500000" cy="300000"/></a:xfrm>
        </p:spPr>
        <p:txBody>
          <a:bodyPr lIns="0" tIns="0" rIns="0" bIns="0" rtlCol="0"/>
          <a:lstStyle/>
          <a:p>
            <a:r><a:rPr lang="vi-VN" sz="900" b="1"><a:solidFill><a:srgbClr val="3BA117"/></a:solidFill></a:rPr><a:t>AgriConnect 2026</a:t></a:r>
            <a:r><a:rPr lang="vi-VN" sz="900"><a:solidFill><a:srgbClr val="64748B"/></a:solidFill></a:rPr><a:t> • Khởi nghiệp và Đổi mới sáng tạo - Sinh viên • https://agriconnect-yagt.vercel.app/ • Slide $num/10</a:t></a:r>
          </a:p>
        </p:txBody>
      </p:sp>

    </p:spTree>
  </p:cSld>
  <p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>
</p:sld>
"@
    [System.IO.File]::WriteAllText((Join-Path $slidesDir "slide$num.xml"), $slideXml, [System.Text.Encoding]::UTF8)
}

# 8. Đóng gói file .pptx
Add-Type -AssemblyName System.IO.Compression.FileSystem
if (Test-Path $OutputPath) {
    Remove-Item $OutputPath -Force
}

[System.IO.Compression.ZipFile]::CreateFromDirectory($tempDir, $OutputPath, [System.IO.Compression.CompressionLevel]::Optimal, $false)
Remove-Item -Recurse -Force $tempDir

Write-Output "PPTX_GENERATED_SUCCESS: $OutputPath"
