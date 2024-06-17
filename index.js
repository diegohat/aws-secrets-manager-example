import "dotenv/config";
import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";
import mqtt from "mqtt";

const client = new SecretsManagerClient({
  region: process.env.AWS_REGION,
});

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

async function loadSecrets() {
  const secret = await getSecretValue(process.env.SECRET_NAME);
  for (const key in process.env) {
    if (process.env[key].startsWith("!")) {
      const secretKey = process.env[key].replace("!", "");
      process.env[key] = secret[secretKey];
    }
  }
}

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
