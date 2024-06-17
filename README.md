# AWS Secrets Manager MQTT Example

This repository contains an example of how to use AWS Secrets Manager with Node.js to securely manage and use secrets for connecting to an MQTT server.

## Overview

The provided code demonstrates how to:
1. Retrieve secrets from AWS Secrets Manager.
2. Load these secrets into environment variables.
3. Use the secrets to establish a connection to an MQTT server.

## Prerequisites

- Node.js (v12.x or higher)
- AWS account with Secrets Manager setup
- MQTT broker/server

## Setup

1. **Clone the repository:**

   ```bash
   git clone <repository_url>
   cd <repository_directory>
   ```

2. **Install dependencies:**

   ```bash
   yarn add dotenv @aws-sdk/client-secrets-manager mqtt
   ```

3. **Environment Variables:**

   Create a `.env` file in the root of your project and add the following environment variables:

   ```plaintext
   AWS_REGION=your_aws_region
   SECRET_NAME=your_secret_name
   MQTT_SERVER=mqtt://your_mqtt_server_address
   MQTT_USERNAME=!mqtt_username_key
   MQTT_PASSWORD=!mqtt_password_key
   ```

   - `AWS_REGION`: Your AWS region where the Secrets Manager is set up.
   - `SECRET_NAME`: The name of the secret stored in AWS Secrets Manager.
   - `MQTT_SERVER`: The address of your MQTT server.
   - `MQTT_USERNAME`: The key for the MQTT username in your secret. Prefix with `!` to indicate it's a secret.
   - `MQTT_PASSWORD`: The key for the MQTT password in your secret. Prefix with `!` to indicate it's a secret.

## Usage

1. **Start the application:**

   ```bash
   node index.js
   ```

   The application will:
   - Retrieve secrets from AWS Secrets Manager.
   - Replace the placeholders in environment variables with the actual secret values.
   - Connect to the MQTT server using the retrieved credentials.
   - Subscribe to a specific topic and publish a message to it.

## Code Explanation

### Load Environment Variables

The code begins by loading environment variables using `dotenv`:

```javascript
import "dotenv/config";
```

### AWS Secrets Manager Client

A Secrets Manager client is created:

```javascript
const client = new SecretsManagerClient({
  region: process.env.AWS_REGION,
});
```

### Retrieve Secret Value

A function to get the secret value from AWS Secrets Manager:

```javascript
async function getSecretValue(secretName) {
  let response;
  try {
    response = await client.send(
      new GetSecretValueCommand({
        SecretId: secretName,
        VersionStage: "AWSCURRENT",
      })
    );
  } catch (error) {
    throw error;
  }
  if (response.SecretString) {
    return JSON.parse(response.SecretString);
  } else {
    throw new Error("Secret does not have a valid format.");
  }
}
```

### Load Secrets into Environment Variables

This function loads the secrets into the environment variables:

```javascript
async function loadSecrets() {
  const secret = await getSecretValue(process.env.SECRET_NAME);
  for (const key in process.env) {
    if (process.env[key].startsWith("!")) {
      const secretKey = process.env[key].replace("!", "");
      process.env[key] = secret[secretKey];
    }
  }
}
```

### Connect to MQTT

The main function to connect to the MQTT server:

```javascript
async function connectMQTT() {
  try {
    await loadSecrets();
    console.log("Secrets loaded");
    console.log(process.env.MQTT_USERNAME);
    console.log(process.env.MQTT_PASSWORD);
    const mqttClient = mqtt.connect(process.env.MQTT_SERVER, {
      username: process.env.MQTT_USERNAME,
      password: process.env.MQTT_PASSWORD,
    });

    mqttClient.on("connect", () => {
      console.log("Connected to MQTT server");
      mqttClient.subscribe("hedro/mqtt/secrets", (err) => {
        if (!err) {
          console.log("Subscribed to hedro/mqtt/secrets");
        }
      });

      mqttClient.publish("hedro/mqtt/secrets", "Hello MQTT using secrets!");
    });

    process.on("SIGINT", () => {
      console.log("Disconnecting MQTT client...");
      mqttClient.end(() => {
        console.log("MQTT client disconnected");
        process.exit(0);
      });
    });
    
  } catch (error) {
    console.error(error);
  }
}

connectMQTT();
```

## Error Handling

The code includes error handling to manage issues with retrieving secrets or connecting to the MQTT server.

## Cleanup

Graceful cleanup is handled to disconnect the MQTT client on application termination:

```javascript
process.on("SIGINT", () => {
  console.log("Disconnecting MQTT client...");
  mqttClient.end(() => {
    console.log("MQTT client disconnected");
    process.exit(0);
  });
});
```

## License

This project is licensed under the MIT License. See the LICENSE file for more details.

---

Feel free to modify this README.md according to your specific project needs.
