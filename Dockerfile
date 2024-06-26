FROM node:20

# Set the working directory
WORKDIR /usr/src/app

# Install ffmpeg
RUN apt-get update && apt-get install -y ffmpeg

# Copy root package.json and lockfile
COPY package.json ./
COPY package-lock.json ./

# Install dependencies
RUN npm install

# Copy app source
COPY . .

# Ensure the application listens on port 8080
ENV PORT 8080

# Expose the port the app runs on
EXPOSE 8080

# Start the application
CMD [ "npm", "run", "start-app" ]
