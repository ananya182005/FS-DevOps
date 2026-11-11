// Windows Jenkins agent with Git, Docker Desktop, and PowerShell available.
// Configure the Jenkins job as "Pipeline script from SCM" (Git).
pipeline {
    agent any
    
    options { timestamps(); disableConcurrentBuilds() }
    environment {
        DEPLOY_PATH = 'C:\\deploy\\live-task-board'
        COMPOSE_PROJECT_NAME = 'live-task-board'
    }
    stages {
        stage('Checkout') {
            steps {
                checkout scm
                powershell 'git rev-parse --short HEAD'
            }
        }
        stage('Build') {
            steps {
                powershell '''
                    $ErrorActionPreference = 'Stop'
                    docker compose -p $env:COMPOSE_PROJECT_NAME build
                    if ($LASTEXITCODE -ne 0) { throw 'Docker image build failed' }
                '''
            }
        }
        stage('Deploy') {
            steps {
                powershell '''
                    $ErrorActionPreference = 'Stop'
                    New-Item -ItemType Directory -Path $env:DEPLOY_PATH -Force | Out-Null
                    Copy-Item -Path docker-compose.yml -Destination (Join-Path $env:DEPLOY_PATH 'docker-compose.yml') -Force
                    $composeFile = Join-Path $env:DEPLOY_PATH 'docker-compose.yml'
                    docker compose -p $env:COMPOSE_PROJECT_NAME -f $composeFile up -d --no-build --remove-orphans
                    if ($LASTEXITCODE -ne 0) { throw 'Docker Compose deployment failed' }
                    docker compose -p $env:COMPOSE_PROJECT_NAME -f $composeFile ps
                    if ($LASTEXITCODE -ne 0) { throw 'Docker Compose status check failed' }
                '''
            }
        }
    }
}
