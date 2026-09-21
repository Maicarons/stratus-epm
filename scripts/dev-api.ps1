#!/usr/bin/env pwsh
Set-Location (Join-Path $PSScriptRoot '..')
pnpm seed
pnpm dev:api
