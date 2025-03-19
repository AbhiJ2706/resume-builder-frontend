source .env
aws ecr get-login-password --region us-east-2 | docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.us-east-2.amazonaws.com
docker build -t resume-builder-frontend . --platform linux/amd64
docker tag resume-builder-frontend ${AWS_ACCOUNT_ID}.dkr.ecr.us-east-2.amazonaws.com/resume-builder/frontend:latest
docker push ${AWS_ACCOUNT_ID}.dkr.ecr.us-east-2.amazonaws.com/resume-builder/frontend:latest
