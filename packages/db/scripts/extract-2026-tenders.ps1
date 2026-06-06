param(
  [string]$SourceRoot = "C:\Users\JacobC\Sithembe Transportation & Projects\Sithembe - Documents\01 Tender Documents\2026",
  [string]$UserEmail = "accounts@livhuandmusa.co.za",
  [string]$OutputPath = "data\tenders-2026-accounts-livhuandmusa.json",
  [string]$SummaryPath = "data\tenders-2026-accounts-livhuandmusa.summary.json",
  [switch]$ExtractPdfText
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.IO.Compression.FileSystem
Add-Type -AssemblyName System.Web

$script:WordApplication = $null

function Convert-XmlTextToPlainText {
  param([string]$Xml)

  if ([string]::IsNullOrWhiteSpace($Xml)) {
    return ""
  }

  $text = $Xml -replace "<[^>]+>", " "
  $text = [System.Web.HttpUtility]::HtmlDecode($text)
  $text = $text -replace "\s+", " "
  return $text.Trim()
}

function Read-ZipEntryText {
  param(
    [string]$Path,
    [string[]]$EntryPatterns
  )

  $parts = New-Object System.Collections.Generic.List[string]

  try {
    $archive = [System.IO.Compression.ZipFile]::OpenRead($Path)
    try {
      foreach ($entry in $archive.Entries) {
        foreach ($pattern in $EntryPatterns) {
          if ($entry.FullName -like $pattern) {
            $reader = New-Object System.IO.StreamReader($entry.Open())
            try {
              $parts.Add($reader.ReadToEnd())
            } finally {
              $reader.Dispose()
            }
            break
          }
        }
      }
    } finally {
      $archive.Dispose()
    }
  } catch {
    return ""
  }

  return (Convert-XmlTextToPlainText ($parts -join " "))
}

function Read-OfficeText {
  param([string]$Path)

  $extension = [System.IO.Path]::GetExtension($Path).ToLowerInvariant()
  switch ($extension) {
    ".docx" {
      return Read-ZipEntryText -Path $Path -EntryPatterns @(
        "word/document.xml",
        "word/header*.xml",
        "word/footer*.xml"
      )
    }
    ".xlsx" {
      return Read-ZipEntryText -Path $Path -EntryPatterns @(
        "xl/sharedStrings.xml",
        "xl/worksheets/sheet*.xml"
      )
    }
    default {
      return ""
    }
  }
}

function Get-WordApplication {
  if ($null -eq $script:WordApplication) {
    $script:WordApplication = New-Object -ComObject Word.Application
    $script:WordApplication.Visible = $false
    $script:WordApplication.DisplayAlerts = 0
  }

  return $script:WordApplication
}

function Read-PdfTextWithWord {
  param([string]$Path)

  try {
    $word = Get-WordApplication
    $document = $word.Documents.Open($Path, $false, $true, $false)
    try {
      $text = $document.Content.Text
      $text = $text -replace "\s+", " "
      return $text.Trim()
    } finally {
      $document.Close(0)
    }
  } catch {
    return ""
  }
}

function First-Match {
  param(
    [string]$Text,
    [string[]]$Patterns
  )

  foreach ($pattern in $Patterns) {
    $match = [regex]::Match($Text, $pattern, [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
    if ($match.Success) {
      if ($match.Groups.Count -gt 1) {
        return (($match.Groups[1].Value -replace "\s+", " ").Trim(" :;-`t`r`n"))
      }
      return (($match.Value -replace "\s+", " ").Trim(" :;-`t`r`n"))
    }
  }

  return $null
}

function First-Date {
  param(
    [string]$Text,
    [string[]]$LeadPatterns
  )

  $datePattern = "([0-3]?\d[\/\-. ][01]?\d[\/\-. ](?:20)?2[0-9]|(?:20)?2[0-9][\/\-. ][01]?\d[\/\-. ][0-3]?\d|[0-3]?\d\s+(?:Jan|January|Feb|February|Mar|March|Apr|April|May|Jun|June|Jul|July|Aug|August|Sep|Sept|September|Oct|October|Nov|November|Dec|December)\s+(?:20)?2[0-9])"

  foreach ($lead in $LeadPatterns) {
    $match = [regex]::Match($Text, "$lead.{0,120}?$datePattern", [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
    if ($match.Success) {
      return (($match.Groups[$match.Groups.Count - 1].Value -replace "\s+", " ").Trim())
    }
  }

  return $null
}

function Normalize-Status {
  param([string]$PathText)

  if ($PathText -match "(?i)\b(submitted|submission|sent)\b") { return "submitted" }
  if ($PathText -match "(?i)\b(won|awarded|award)\b") { return "won" }
  if ($PathText -match "(?i)\b(lost|unsuccessful|declined)\b") { return "lost" }
  return "draft"
}

function Get-RelativePathCompat {
  param(
    [string]$Root,
    [string]$Path
  )

  $rootFullPath = [System.IO.Path]::GetFullPath($Root).TrimEnd("\", "/") + "\"
  $pathFullPath = [System.IO.Path]::GetFullPath($Path)
  $rootUri = New-Object System.Uri($rootFullPath)
  $pathUri = New-Object System.Uri($pathFullPath)
  return ([System.Uri]::UnescapeDataString($rootUri.MakeRelativeUri($pathUri).ToString()) -replace "/", "\")
}

function Get-TenderKey {
  param(
    [string]$Root,
    [string]$FilePath
  )

  $relative = Get-RelativePathCompat -Root $Root -Path $FilePath
  $parts = $relative -split "[\\/]+"

  if ($parts.Count -lt 4) {
    return $null
  }

  $month = $parts[0]
  if ($month -eq "2025") {
    return $null
  }

  return [pscustomobject]@{
    Month = $month
    Day = $parts[1]
    Folder = $parts[2]
    Key = ($parts[0..2] -join "\")
  }
}

function New-TenderRecord {
  param(
    [string]$UserEmail,
    [string]$Month,
    [string]$Day,
    [string]$Folder,
    [string]$Key
  )

  return [ordered]@{
    userEmail = $UserEmail
    tenderNumber = $Folder
    description = $null
    clientName = $null
    clientNotes = $null
    clientContactName = $null
    clientContactEmail = $null
    clientContactPhone = $null
    submissionDate = $null
    value = $null
    status = "draft"
    evaluationDate = $null
    validityDays = $null
    validityDate = $null
    contactName = $null
    contactEmail = $null
    contactPhone = $null
    briefingDate = $null
    briefingLocation = $null
    isBriefingMandatory = $false
    briefingAttended = $false
    source = [ordered]@{
      root = $SourceRoot
      group = $Key
      month = $Month
      day = $Day
      folder = $Folder
      files = @()
      fileCount = 0
      skippedNestedFileCount = 0
      extractedTextFiles = @()
      pdfFiles = @()
      confidence = "low"
      notes = @()
    }
  }
}

if (-not (Test-Path -LiteralPath $SourceRoot)) {
  throw "Source folder does not exist: $SourceRoot"
}

$outputDir = Split-Path -Parent $OutputPath
if ($outputDir -and -not (Test-Path -LiteralPath $outputDir)) {
  New-Item -ItemType Directory -Path $outputDir | Out-Null
}

$recordsByKey = @{}
$textsByKey = @{}
$supportedTextExtensions = @(".docx", ".xlsx")

$files = Get-ChildItem -LiteralPath $SourceRoot -Recurse -File
foreach ($file in $files) {
  $keyInfo = Get-TenderKey -Root $SourceRoot -FilePath $file.FullName
  if ($null -eq $keyInfo) {
    continue
  }

  if (-not $recordsByKey.ContainsKey($keyInfo.Key)) {
    $recordsByKey[$keyInfo.Key] = New-TenderRecord `
      -UserEmail $UserEmail `
      -Month $keyInfo.Month `
      -Day $keyInfo.Day `
      -Folder $keyInfo.Folder `
      -Key $keyInfo.Key
    $textsByKey[$keyInfo.Key] = New-Object System.Collections.Generic.List[string]
  }

  $record = $recordsByKey[$keyInfo.Key]
  $relativeFile = Get-RelativePathCompat -Root $SourceRoot -Path $file.FullName
  $relativeParts = $relativeFile -split "[\\/]+"
  $isDirectTenderFile = $relativeParts.Count -eq 4
  $isVendorOrQuoteFile = $relativeFile -match "(?i)[\\\/](quotations|qoutations|quotes|supplier|suppliers|vendor|vendors)[\\\/]"

  $record.source.fileCount += 1
  if ($isDirectTenderFile -or $record.source.files.Count -lt 30) {
    $record.source.files += $relativeFile
  } else {
    $record.source.skippedNestedFileCount += 1
  }

  $extension = $file.Extension.ToLowerInvariant()
  if ($extension -eq ".pdf" -and ($isDirectTenderFile -or $record.source.pdfFiles.Count -lt 20)) {
    $record.source.pdfFiles += $relativeFile
  }

  if (($supportedTextExtensions -contains $extension) -and $isDirectTenderFile -and -not $isVendorOrQuoteFile) {
    $text = Read-OfficeText -Path $file.FullName
    if (-not [string]::IsNullOrWhiteSpace($text)) {
      $record.source.extractedTextFiles += $relativeFile
      $textsByKey[$keyInfo.Key].Add($text)
    }
  }

  if (
    $ExtractPdfText `
      -and $extension -eq ".pdf" `
      -and $isDirectTenderFile `
      -and -not $isVendorOrQuoteFile `
      -and $file.Name -match "(?i)(tender|bid|document|rfq|contract|scan)"
  ) {
    $text = Read-PdfTextWithWord -Path $file.FullName
    if (-not [string]::IsNullOrWhiteSpace($text)) {
      $record.source.extractedTextFiles += $relativeFile
      $textsByKey[$keyInfo.Key].Add($text)
    }
  }
}

$records = New-Object System.Collections.Generic.List[object]
foreach ($key in ($recordsByKey.Keys | Sort-Object)) {
  $record = $recordsByKey[$key]
  $combinedText = (($textsByKey[$key] -join " ") -replace "\s+", " ").Trim()
  $fileNameText = ($record.source.files -join " ")
  $searchText = "$combinedText $fileNameText"
  $folderLooksGeneric = $record.source.folder -match "(?i)^(scanned|scan|quotations|qoutations|quotes|cvs?|documents?|tender docs?|files?)$"

  $candidateNumber = First-Match -Text $combinedText -Patterns @(
    "\b(?:tender|bid|contract|rfq|quotation)\s*(?:no\.?|number|ref(?:erence)?\.?)?\s*[:#-]?\s*([A-Z0-9][A-Z0-9\/\-.]{2,})",
    "\b([A-Z]{2,}[\/\-.]?\d{2,}[A-Z0-9\/\-.]*)\b"
  )
  if (-not $candidateNumber -and $folderLooksGeneric) {
    $candidateNumber = First-Match -Text $fileNameText -Patterns @(
      "\b(?:tender|bid|contract|rfq|quotation)[\-_ ]*([A-Z0-9][A-Z0-9\/\-.]{2,})",
      "\b([A-Z]{2,}[\/\-.]?\d{2,}[A-Z0-9\/\-.]*)\b"
    )
  }
  if ($candidateNumber -and ($candidateNumber -notmatch "(?i)\.(pdf|docx?|xlsx?)$") -and ($folderLooksGeneric -or $record.source.folder -notmatch "\d")) {
    $record.tenderNumber = $candidateNumber
  }

  $description = First-Match -Text $searchText -Patterns @(
    "(?:description|bid description|tender description|project description|contract title|scope of work)\s*[:;-]\s*(.{12,180}?)(?: closing| briefing| tender no| bid no| compulsory| cidb|$)",
    "(?:appointment of|supply and delivery of|provision of|construction of|maintenance of|repairs? and maintenance of)\s+(.{12,180}?)(?: closing| briefing| tender no| bid no| compulsory| cidb|$)"
  )
  if ($description) {
    $record.description = $description
  } else {
    $record.description = ($record.source.folder -replace "^\d+[\.\-_ ]*", "").Trim()
    if ([string]::IsNullOrWhiteSpace($record.description)) {
      $record.description = $null
    }
  }

  $clientName = First-Match -Text $searchText -Patterns @(
    "\b((?:Department|City|Municipality|District Municipality|Local Municipality|Metropolitan Municipality|Province|Transnet|Eskom|SANRAL|PRASA|Rand Water|Water Board|TVET|University|Hospital)\s+of\s+.{3,80}?)(?: tender| bid| request| invites| hereby|$)",
    "\b([A-Z][A-Za-z &'\-]+(?:Municipality|Department|Eskom|Transnet|SANRAL|PRASA|University|Hospital|TVET))\b"
  )
  if ($clientName) {
    $record.clientName = $clientName
  } else {
    $record.clientName = "Unknown Client"
    $record.source.notes += "Client name not found in extractable DOCX/XLSX text; set to Unknown Client for import review."
  }

  $record.submissionDate = First-Date -Text $searchText -LeadPatterns @("closing\s*(?:date|time)?", "submission\s*(?:date|deadline)?", "bid\s*closing")
  $record.briefingDate = First-Date -Text $searchText -LeadPatterns @("briefing\s*(?:session|meeting|date)?", "site\s*(?:inspection|meeting)", "compulsory\s*(?:briefing|site)")
  $record.evaluationDate = First-Date -Text $searchText -LeadPatterns @("evaluation\s*(?:date|period)?", "valid(?:ity)?\s*(?:period|date)")

  $email = First-Match -Text $searchText -Patterns @("([A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,})")
  if ($email) {
    $record.contactEmail = $email.ToLowerInvariant()
  }

  $phone = First-Match -Text $searchText -Patterns @("(\+?27[\s\-.]?\d{2}[\s\-.]?\d{3}[\s\-.]?\d{4}|0\d{2}[\s\-.]?\d{3}[\s\-.]?\d{4})")
  if ($phone) {
    $digitsOnly = $phone -replace "\D", ""
    if ($digitsOnly -notmatch "^0+$") {
      $record.contactPhone = $phone
    }
  }

  $validityDays = First-Match -Text $searchText -Patterns @("(?:validity|valid for).{0,40}?(\d{2,3})\s*days")
  if ($validityDays) {
    $record.validityDays = [int]$validityDays
  }

  $amount = First-Match -Text $searchText -Patterns @("(?:total|amount|contract value|bid price|tender price).{0,50}?(R\s?\d[\d\s,]*(?:\.\d{2})?)")
  if ($amount) {
    $record.value = $amount
  }

  if ($searchText -match "(?i)\b(compulsory|mandatory)\b.{0,80}\b(briefing|site inspection|site meeting)\b") {
    $record.isBriefingMandatory = $true
  }

  $record.status = Normalize-Status -PathText "$key $fileNameText"

  if ($record.source.extractedTextFiles.Count -gt 0) {
    $record.source.confidence = "medium"
  }
  if ($record.clientName -ne "Unknown Client" -and $record.description -and $record.submissionDate) {
    $record.source.confidence = "high"
  }
  if ($record.source.pdfFiles.Count -gt 0) {
    $record.source.notes += "PDF text was not extracted by this local script; PDF filenames are included as evidence."
  }

  $records.Add([pscustomobject]$record)
}

$summary = [ordered]@{
  sourceRoot = $SourceRoot
  userEmail = $UserEmail
  generatedAt = (Get-Date).ToString("o")
  tenderRecords = $records.Count
  filesScanned = $files.Count
  recordsByConfidence = ($records | Group-Object { $_.source.confidence } | ForEach-Object {
    [ordered]@{ confidence = $_.Name; count = $_.Count }
  })
  missingClientName = @($records | Where-Object { $_.clientName -eq "Unknown Client" }).Count
  missingDescription = @($records | Where-Object { -not $_.description }).Count
  missingSubmissionDate = @($records | Where-Object { -not $_.submissionDate }).Count
}

$records | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $OutputPath -Encoding UTF8
$summary | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath $SummaryPath -Encoding UTF8

if ($null -ne $script:WordApplication) {
  $script:WordApplication.Quit()
}

Write-Host "Wrote $($records.Count) tender records to $OutputPath"
Write-Host "Wrote extraction summary to $SummaryPath"
