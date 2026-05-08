param(
  [Parameter(Position = 0)]
  [string]$Goal,

  [switch]$Plan,
  [switch]$SkipClaudePlan,
  [switch]$SkipReview,
  [switch]$NoVerify,
  [switch]$DryRun,
  [switch]$Loop,
  [ValidateRange(1, 10)]
  [int]$MaxRounds = 1,

  [string]$ClaudeCommand = $(if ($env:CLAUDE_COMMAND) { $env:CLAUDE_COMMAND } else { "claude" }),
  [string]$CodexCommand = $(if ($env:CODEX_COMMAND) { $env:CODEX_COMMAND } else { "codex" })
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot = Resolve-Path (Join-Path $ScriptDir "..")
$PlanPath = Join-Path $RepoRoot "PLAN.md"
$ProgressPath = Join-Path $RepoRoot "PROGRESS.md"
$LastErrorPath = Join-Path $RepoRoot "LAST_ERROR.txt"
$LogsDir = Join-Path $ScriptDir "logs"
$PromptDir = Join-Path $ScriptDir "prompts"

function Write-Step {
  param([string]$Message)
  Write-Host ""
  Write-Host "==> $Message" -ForegroundColor Cyan
}

function Write-Info {
  param([string]$Message)
  Write-Host "    $Message" -ForegroundColor Gray
}

function Append-Progress {
  param([string]$Message)
  $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
  Add-Content -LiteralPath $ProgressPath -Encoding utf8 -Value "- [$timestamp] $Message"
}

function Ensure-TrackingFiles {
  if (!(Test-Path -LiteralPath $ProgressPath)) {
    "# PROGRESS`n" | Out-File -LiteralPath $ProgressPath -Encoding utf8
  }

  if (!(Test-Path -LiteralPath $LastErrorPath)) {
    "" | Out-File -LiteralPath $LastErrorPath -Encoding utf8
  }

  if (!(Test-Path -LiteralPath $LogsDir)) {
    New-Item -ItemType Directory -Path $LogsDir | Out-Null
  }
}

function Read-Template {
  param(
    [string]$Name,
    [string]$GoalText
  )

  $path = Join-Path $PromptDir $Name
  if (!(Test-Path -LiteralPath $path)) {
    throw "Prompt file not found: $path"
  }

  $text = Get-Content -LiteralPath $path -Raw
  $text = $text.Replace("{{GOAL}}", $GoalText)
  $text = $text.Replace("{{REPO_ROOT}}", $RepoRoot.Path)
  return $text
}

function Save-Failure {
  param(
    [string]$Stage,
    [string]$Details,
    [string]$LogPath
  )

  $content = @"
# LAST ERROR

Time: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
Stage: $Stage

## Summary
$Details

## Log
$LogPath
"@

  $content | Out-File -LiteralPath $LastErrorPath -Encoding utf8
  Append-Progress "FAILED during $Stage. Details saved to LAST_ERROR.txt."
}

function Test-CommandExists {
  param([string]$Command)
  return [bool](Get-Command $Command -ErrorAction SilentlyContinue)
}

function Resolve-CommandPath {
  param([string]$Command)

  $cmd = Get-Command $Command -ErrorAction SilentlyContinue
  if (!$cmd -and $Command -eq "codex") {
    $extensionRoot = Join-Path $env:USERPROFILE ".vscode\extensions"
    if (Test-Path -LiteralPath $extensionRoot) {
      $candidate = Get-ChildItem -LiteralPath $extensionRoot -Recurse -Filter "codex.exe" -ErrorAction SilentlyContinue |
        Sort-Object LastWriteTime -Descending |
        Select-Object -First 1
      if ($candidate) {
        return $candidate.FullName
      }
    }
  }

  if (!$cmd) {
    return $Command
  }

  if ($cmd.Path) {
    if ($cmd.Path.ToLowerInvariant().EndsWith(".ps1")) {
      $cmdShim = [System.IO.Path]::ChangeExtension($cmd.Path, ".cmd")
      if (Test-Path -LiteralPath $cmdShim) {
        return $cmdShim
      }
    }
    return $cmd.Path
  }

  if ($cmd.Source) {
    if ($cmd.Source.ToLowerInvariant().EndsWith(".ps1")) {
      $cmdShim = [System.IO.Path]::ChangeExtension($cmd.Source, ".cmd")
      if (Test-Path -LiteralPath $cmdShim) {
        return $cmdShim
      }
    }
    return $cmd.Source
  }

  return $Command
}

function Join-ProcessArguments {
  param([string[]]$Arguments)

  $quoted = foreach ($arg in $Arguments) {
    if ($null -eq $arg) {
      '""'
    } elseif ($arg -match '[\s"]') {
      $escaped = $arg -replace '"', '\"'
      '"' + $escaped + '"'
    } else {
      $arg
    }
  }

  return ($quoted -join " ")
}

function Invoke-LoggedCommand {
  param(
    [string]$Stage,
    [string]$FilePath,
    [string[]]$Arguments,
    [string]$StandardInput = ""
  )

  $stamp = Get-Date -Format "yyyyMMdd-HHmmss"
  $safeStage = $Stage -replace "[^A-Za-z0-9_-]", "_"
  $stdoutPath = Join-Path $LogsDir "$stamp-$safeStage.out.log"
  $stderrPath = Join-Path $LogsDir "$stamp-$safeStage.err.log"
  $stdinPath = Join-Path $LogsDir "$stamp-$safeStage.prompt.md"

  if ($StandardInput) {
    $StandardInput | Out-File -LiteralPath $stdinPath -Encoding utf8
  }

  $resolvedFilePath = Resolve-CommandPath -Command $FilePath
  $processFilePath = $resolvedFilePath
  $processArguments = $Arguments

  $extension = [System.IO.Path]::GetExtension($resolvedFilePath).ToLowerInvariant()
  if ($extension -eq ".ps1") {
    $processFilePath = "powershell.exe"
    $processArguments = @("-NoProfile", "-ExecutionPolicy", "Bypass", "-File", $resolvedFilePath) + $Arguments
  } elseif ($extension -eq ".cmd" -or $extension -eq ".bat") {
    $processFilePath = $env:ComSpec
    if ([string]::IsNullOrWhiteSpace($processFilePath)) {
      $processFilePath = "cmd.exe"
    }
    $commandLine = '"' + $resolvedFilePath + '" ' + (Join-ProcessArguments -Arguments $Arguments)
    $processArguments = @("/d", "/s", "/c", $commandLine)
  }

  $displayArgs = $processArguments -join " "
  Write-Info "$processFilePath $displayArgs"

  if ($DryRun) {
    Write-Info "Dry run: skipped."
    return @{
      ExitCode = 0
      StdoutPath = $stdoutPath
      StderrPath = $stderrPath
      StdinPath = $stdinPath
    }
  }

  $psi = New-Object System.Diagnostics.ProcessStartInfo
  $psi.FileName = $processFilePath
  $psi.Arguments = Join-ProcessArguments -Arguments $processArguments
  $psi.WorkingDirectory = $RepoRoot.Path
  $psi.RedirectStandardOutput = $true
  $psi.RedirectStandardError = $true
  $psi.RedirectStandardInput = [bool]$StandardInput
  $psi.UseShellExecute = $false
  $psi.CreateNoWindow = $true

  $process = New-Object System.Diagnostics.Process
  $process.StartInfo = $psi
  [void]$process.Start()

  if ($StandardInput) {
    $process.StandardInput.Write($StandardInput)
    $process.StandardInput.Close()
  }

  $stdout = $process.StandardOutput.ReadToEnd()
  $stderr = $process.StandardError.ReadToEnd()
  $process.WaitForExit()

  $stdout | Out-File -LiteralPath $stdoutPath -Encoding utf8
  $stderr | Out-File -LiteralPath $stderrPath -Encoding utf8

  if ($stdout.Trim()) {
    Write-Info "stdout: $stdoutPath"
  }
  if ($stderr.Trim()) {
    Write-Info "stderr: $stderrPath"
  }

  return @{
    ExitCode = $process.ExitCode
    StdoutPath = $stdoutPath
    StderrPath = $stderrPath
    StdinPath = $stdinPath
  }
}

function Invoke-ClaudePrompt {
  param(
    [string]$Stage,
    [string]$Prompt
  )

  if (!$DryRun -and !(Test-CommandExists $ClaudeCommand)) {
    throw "Claude Code CLI command '$ClaudeCommand' was not found. Install it with: npm install -g @anthropic-ai/claude-code. Then run 'claude' once to log in. If your command has a different name, pass -ClaudeCommand or set CLAUDE_COMMAND."
  }

  return Invoke-LoggedCommand -Stage $Stage -FilePath $ClaudeCommand -Arguments @("-p") -StandardInput $Prompt
}

function Invoke-CodexPrompt {
  param(
    [string]$Stage,
    [string]$Prompt
  )

  $resolvedCodex = Resolve-CommandPath -Command $CodexCommand
  if (!$DryRun -and !(Test-Path -LiteralPath $resolvedCodex) -and !(Test-CommandExists $CodexCommand)) {
    throw "Codex CLI command '$CodexCommand' was not found. Install it, open VS Code ChatGPT extension once, or pass -CodexCommand / set CODEX_COMMAND to the full codex.exe path."
  }

  $lastMessage = Join-Path $LogsDir ("{0}-{1}.last.md" -f (Get-Date -Format "yyyyMMdd-HHmmss"), ($Stage -replace "[^A-Za-z0-9_-]", "_"))
  $args = @(
    "exec",
    "-C", $RepoRoot.Path,
    "-s", "workspace-write",
    "-o", $lastMessage,
    "-"
  )

  return Invoke-LoggedCommand -Stage $Stage -FilePath $resolvedCodex -Arguments $args -StandardInput $Prompt
}

function Get-JsonFile {
  param([string]$Path)

  if (!(Test-Path -LiteralPath $Path)) {
    return $null
  }

  try {
    return Get-Content -LiteralPath $Path -Raw | ConvertFrom-Json
  } catch {
    return $null
  }
}

function Get-VerificationCommands {
  param([string]$GoalText)

  $commands = New-Object System.Collections.Generic.List[object]
  $rootPkg = Get-JsonFile (Join-Path $RepoRoot "package.json")
  $hasB2c = Test-Path -LiteralPath (Join-Path $RepoRoot "web-b2c/package.json")
  $hasB2b = Test-Path -LiteralPath (Join-Path $RepoRoot "web-b2b/package.json")

  $goalLower = $GoalText.ToLowerInvariant()
  $planLower = ""
  if (Test-Path -LiteralPath $PlanPath) {
    $planLower = (Get-Content -LiteralPath $PlanPath -Raw).ToLowerInvariant()
  }

  $target = "root"
  if ($goalLower.Contains("web-b2c") -or $goalLower.Contains("b2c") -or $planLower.Contains("web-b2c")) {
    $target = "web-b2c"
  } elseif ($goalLower.Contains("web-b2b") -or $goalLower.Contains("b2b") -or $planLower.Contains("web-b2b")) {
    $target = "web-b2b"
  } elseif ($hasB2c) {
    $target = "web-b2c"
  } elseif ($hasB2b) {
    $target = "web-b2b"
  }

  if ($target -eq "web-b2c") {
    $pkg = Get-JsonFile (Join-Path $RepoRoot "web-b2c/package.json")
    if ($pkg.scripts.lint) { $commands.Add(@("npm.cmd", @("run", "lint", "--prefix", "web-b2c"))) }
    if ($pkg.scripts.build) { $commands.Add(@("npm.cmd", @("run", "build", "--prefix", "web-b2c"))) }
  } elseif ($target -eq "web-b2b") {
    $pkg = Get-JsonFile (Join-Path $RepoRoot "web-b2b/package.json")
    if ($pkg.scripts.lint) { $commands.Add(@("npm.cmd", @("run", "lint", "--prefix", "web-b2b"))) }
    if ($pkg.scripts.build) { $commands.Add(@("npm.cmd", @("run", "build", "--prefix", "web-b2b"))) }
  } elseif ($rootPkg -and $rootPkg.scripts) {
    if ($rootPkg.scripts.lint) { $commands.Add(@("npm.cmd", @("run", "lint"))) }
    if ($rootPkg.scripts.build) { $commands.Add(@("npm.cmd", @("run", "build"))) }
  }

  return $commands
}

function Invoke-Verification {
  param([string]$GoalText)

  if ($NoVerify) {
    Append-Progress "Verification skipped because -NoVerify was supplied."
    return $true
  }

  $commands = Get-VerificationCommands -GoalText $GoalText
  if ($commands.Count -eq 0) {
    Append-Progress "No verification commands were detected."
    Write-Info "No verification commands detected."
    return $true
  }

  foreach ($cmd in $commands) {
    $file = [string]$cmd[0]
    $args = [string[]]$cmd[1]
    $label = "verify-" + (($args -join "-") -replace "[^A-Za-z0-9_-]", "_")
    $result = Invoke-LoggedCommand -Stage $label -FilePath $file -Arguments $args
    if ($result.ExitCode -ne 0) {
      Save-Failure -Stage $label -Details "Verification command failed: $file $($args -join ' ')" -LogPath "$($result.StdoutPath)`n$($result.StderrPath)"
      return $false
    }
    Append-Progress "Verification passed: $file $($args -join ' ')."
  }

  return $true
}

function Invoke-ClaudeReview {
  param([string]$GoalText)

  if ($SkipReview) {
    Append-Progress "Claude review skipped because -SkipReview was supplied."
    return $true
  }

  Write-Step "Claude review"
  try {
    $reviewPrompt = Read-Template -Name "claude_review_prompt.md" -GoalText $GoalText
    $reviewResult = Invoke-ClaudePrompt -Stage "claude-review" -Prompt $reviewPrompt
    if ($reviewResult.ExitCode -eq 0) {
      Append-Progress "Claude review completed."
      return $true
    }

    Save-Failure -Stage "claude-review" -Details "Claude review failed after successful implementation." -LogPath "$($reviewResult.StdoutPath)`n$($reviewResult.StderrPath)"
    Write-Host "Implementation passed, but Claude review failed. See LAST_ERROR.txt." -ForegroundColor Yellow
    return $false
  } catch {
    Save-Failure -Stage "claude-review" -Details $_.Exception.Message -LogPath ""
    Write-Host "Implementation passed, but Claude review could not run: $($_.Exception.Message)" -ForegroundColor Yellow
    return $false
  }
}

function Invoke-CodexRound {
  param(
    [string]$GoalText,
    [int]$Round
  )

  Write-Step "Codex execution (round $Round)"
  Append-Progress "Starting Codex round $Round."
  $executePrompt = Read-Template -Name "codex_execute_prompt.md" -GoalText $GoalText
  $codexResult = Invoke-CodexPrompt -Stage "codex-execute-r$Round" -Prompt $executePrompt
  if ($codexResult.ExitCode -ne 0) {
    Save-Failure -Stage "codex-execute-r$Round" -Details "Codex execution failed." -LogPath "$($codexResult.StdoutPath)`n$($codexResult.StderrPath)"
  } else {
    Append-Progress "Codex round $Round execution completed."
  }

  Write-Step "Verification (round $Round)"
  $verificationOk = $false
  if ($codexResult.ExitCode -eq 0) {
    $verificationOk = Invoke-Verification -GoalText $GoalText
  }

  if ($codexResult.ExitCode -ne 0 -or !$verificationOk) {
    Write-Step "Codex focused retry (round $Round)"
    $fixPrompt = Read-Template -Name "codex_fix_prompt.md" -GoalText $GoalText
    $fixResult = Invoke-CodexPrompt -Stage "codex-fix-r$Round" -Prompt $fixPrompt
    if ($fixResult.ExitCode -ne 0) {
      Save-Failure -Stage "codex-fix-r$Round" -Details "Codex focused retry failed." -LogPath "$($fixResult.StdoutPath)`n$($fixResult.StderrPath)"
      Write-Host "Workflow failed after retry. See LAST_ERROR.txt." -ForegroundColor Red
      return $false
    }
    Append-Progress "Codex focused retry completed for round $Round."

    Write-Step "Verification after retry (round $Round)"
    $verificationOk = Invoke-Verification -GoalText $GoalText
    if (!$verificationOk) {
      Write-Host "Verification failed after retry. See LAST_ERROR.txt." -ForegroundColor Red
      return $false
    }
  }

  Append-Progress "Round $Round completed successfully."
  return $true
}

function Main {
  if ([string]::IsNullOrWhiteSpace($Goal)) {
    Write-Host "Usage: .\orchestrator\run.ps1 `"Add a /contact page to web-b2c`"" -ForegroundColor Yellow
    Write-Host "Options: -Plan -Loop -MaxRounds 3 -SkipClaudePlan -SkipReview -NoVerify -DryRun -ClaudeCommand <cmd> -CodexCommand <cmd>"
    exit 2
  }

  if (!$Loop -and $MaxRounds -ne 1) {
    Write-Host "-MaxRounds only has an effect with -Loop. Continuing with one round." -ForegroundColor Yellow
    $MaxRounds = 1
  }

  Ensure-TrackingFiles
  Append-Progress "Started workflow. Goal: $Goal"

  Write-Step "Repository"
  Write-Info $RepoRoot.Path

  $needsPlan = $Plan -or !(Test-Path -LiteralPath $PlanPath)
  if ($needsPlan -and !$SkipClaudePlan) {
    Write-Step "Claude planning"
    try {
      $prompt = Read-Template -Name "claude_plan_prompt.md" -GoalText $Goal
      $result = Invoke-ClaudePrompt -Stage "claude-plan" -Prompt $prompt
      if ($result.ExitCode -ne 0) {
        Save-Failure -Stage "claude-plan" -Details "Claude planning failed." -LogPath "$($result.StdoutPath)`n$($result.StderrPath)"
        exit $result.ExitCode
      }
      Append-Progress "Claude planning completed."
    } catch {
      Save-Failure -Stage "claude-plan" -Details $_.Exception.Message -LogPath ""
      Write-Host $_.Exception.Message -ForegroundColor Red
      exit 1
    }
  } elseif ($needsPlan -and $SkipClaudePlan) {
    if (!(Test-Path -LiteralPath $PlanPath)) {
      "# PLAN`n`nGoal: $Goal`n`n## Next task`n- Define implementation steps manually or rerun without -SkipClaudePlan.`n" | Out-File -LiteralPath $PlanPath -Encoding utf8
    }
    Append-Progress "Planning skipped; PLAN.md exists or placeholder was created."
  } else {
    Write-Step "Planning"
    Write-Info "PLAN.md already exists. Use -Plan to ask Claude to refresh it."
    Append-Progress "Used existing PLAN.md."
  }

  $roundCount = if ($Loop) { $MaxRounds } else { 1 }
  Append-Progress "Running $roundCount Codex round(s)."

  for ($round = 1; $round -le $roundCount; $round++) {
    $roundOk = Invoke-CodexRound -GoalText $Goal -Round $round
    if (!$roundOk) {
      exit 1
    }

    "" | Out-File -LiteralPath $LastErrorPath -Encoding utf8

    if ($Loop) {
      $reviewOk = Invoke-ClaudeReview -GoalText $Goal
      if (!$reviewOk) {
        Write-Host "Stopping loop because Claude review did not complete cleanly." -ForegroundColor Yellow
        break
      }

      if ($round -lt $roundCount) {
        Append-Progress "Continuing loop after Claude review. Next round: $($round + 1)."
      }
    }
  }

  if (!$Loop) {
    [void](Invoke-ClaudeReview -GoalText $Goal)
  }

  Append-Progress "Workflow completed successfully. Goal: $Goal"

  Write-Step "Done"
  Write-Host "Progress: $ProgressPath"
  Write-Host "Plan:     $PlanPath"
}

Main
