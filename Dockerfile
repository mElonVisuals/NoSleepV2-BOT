# Use a specific Node.js version
FROM node:20-alpine

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install dependencies
RUN apk add --no-cache python3 make g++ cairo-dev pango-dev jpeg-dev giflib-dev librsvg-dev
RUN npm install --production

# Copy the rest of your application code to the working directory
COPY . .

# Expose the port your bot might listen on (if any, though Discord bots don't usually run HTTP servers)
# If your bot has a web dashboard or similar, specify the port. Otherwise, this line can be omitted.
# EXPOSE 3000

# Command to run the application
CMD ["node", "bot.js"]