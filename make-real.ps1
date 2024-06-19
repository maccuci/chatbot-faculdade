# Função para verificar se o Bun está instalado
function Check-BunInstalled {
    try {
        $bunVersion = bun --version
        if ($bunVersion) {
            return $true
        } else {
            return $false
        }
    } catch {
        return $false
    }
}

Write-Host "Iniciando o download do Bun..."
Start-Sleep -Seconds 3

if (Check-BunInstalled) {
    Write-Host "Bun ja esta instalado."
} else {
    Write-Host "Bun nao encontrado. Instalando Bun..."
    irm https://bun.sh/install.ps1 | iex
    Start-Sleep -Seconds 20
    Write-Host "Bun instalado com sucesso."
}

Write-Host "Terminando de configurar o projeto..."
Start-Sleep -Seconds 2

bun install

Write-Host "Tudo finalizado. Iniciando o bot..."
Start-Sleep -Seconds 2

# Inicia o bot
bun dev