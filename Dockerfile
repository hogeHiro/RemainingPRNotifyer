FROM node:10-alpine
COPY WeeklyWorks app
WORKDIR /app
RUN npm i
CMD ["npm", "run", "start"]
