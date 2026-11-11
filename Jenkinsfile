pipeline {
    agent any

    options { timestamps(); disableConcurrentBuilds() }
    environment {
        COMPOSE_PROJECT_NAME = 'live-task-board'
    }
    stages {
        stage('Checkout') {
            steps {
                checkout scm
                sh 'git rev-parse --short HEAD'
            }
        }
        stage('Build') {
            steps {
                sh 'docker compose build'
            }
        }
        stage('Deploy') {
            steps {
                sh '''
                    docker compose up -d --no-build --remove-orphans
                    docker compose ps
                '''
            }
        }
    }
}