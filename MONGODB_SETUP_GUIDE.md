# MongoDB Atlas Setup Guide

Follow these steps to set up your free MongoDB database and connect it to your UniMart application.

## 1. Create an Account
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register).
2. Sign up for a free account (you can use Google Sign-in).

## 2. Create a Cluster
1. After logging in, click **+ Create** to create a new cluster.
2. Select the **M0 (Free)** tier.
3. Choose a provider (AWS is fine) and a region close to you (e.g., Mumbai `ap-south-1` since you are in India).
4. Give it a name like `UniMartCluster` or leave default.
5. Click **Create**.

## 3. Create a Database User
1. You will be prompted to set up security.
2. **Username**: Enter a username (e.g., `admin`).
3. **Password**: Enter a strong password. **Write this down!** You will need it for the connection string.
4. Click **Create User**.

## 4. Network Access (Allow Connection)
1. Scroll down to "Network Access" or "IP Access List".
2. Click **Add IP Address**.
3. Select **Allow Access from Anywhere** (`0.0.0.0/0`).
   * *Note: This is easiest for development and Vercel deployment. For production, you can restrict this later.*
4. Click **Confirm**.

## 5. Get Connection String
1. Go back to the **Database** overview (click "Database" in the left sidebar).
2. Click the **Connect** button on your cluster.
3. Select **Drivers**.
4. Choose **Node.js** as the driver and version **5.5 or later**.
5. Copy the connection string. It will look like this:
   ```
   mongodb+srv://admin:<db_password>@unimartcluster.abcde.mongodb.net/?retryWrites=true&w=majority&appName=UniMartCluster
   ```

## 6. Configure Your Application
1. Open the `.env` file in your project folder (`c:\Users\shivu\Desktop\deploy\.env`).
2. Paste the connection string into the `MONGODB_URI` field.
3. **Crucial**: Replace `<db_password>` with the actual password you created in Step 3.
   * Example: `mongodb+srv://admin:MySecurePass123@...`
4. Save the file.

## 7. Test Connection
1. Run `npm run dev` in your terminal.
2. If successful, you will see: `✅ MongoDB Connected: ...`
