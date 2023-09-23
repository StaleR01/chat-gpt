build:
 docker build -t tgBotV1 .

 run:
  docker run -d -p 3000:3000 --name tgBotV1 --rm tgBotV1