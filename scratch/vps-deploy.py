import os
import zipfile
import paramiko
from scp import SCPClient

# VPS Connection Details
HOST = '153.92.223.162'
USER = 'root'
PORT = 22
PASSWORD = 'JUNIOR.com0007'
DOMAIN = 'srv1739567.hstgr.cloud'

# Local Paths
LOCAL_BACKEND_DIR = r'c:\Users\Dell\Documents\codeengine1.2\backend'
ZIP_PATH = r'c:\Users\Dell\Documents\codeengine1.2\backend.zip'
REMOTE_ZIP_PATH = '/tmp/backend.zip'
REMOTE_APP_DIR = '/var/www/codeengine-backend'

def zip_backend():
    print("Zipping backend directory (excluding node_modules and .git)...")
    if os.path.exists(ZIP_PATH):
        os.remove(ZIP_PATH)
        
    with zipfile.ZipFile(ZIP_PATH, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(LOCAL_BACKEND_DIR):
            # Exclude node_modules and git metadata
            if 'node_modules' in dirs:
                dirs.remove('node_modules')
            if '.git' in dirs:
                dirs.remove('.git')
                
            for file in files:
                abs_path = os.path.join(root, file)
                rel_path = os.path.relpath(abs_path, LOCAL_BACKEND_DIR)
                zipf.write(abs_path, rel_path)
    print(f"Backend zipped successfully to {ZIP_PATH}")

def run_ssh_cmd(ssh, cmd):
    print(f"Executing command: {cmd}")
    stdin, stdout, stderr = ssh.exec_command(cmd)
    
    # Wait for the command to finish
    exit_status = stdout.channel.recv_exit_status()
    
    out = stdout.read().decode('utf-8', errors='ignore')
    err = stderr.read().decode('utf-8', errors='ignore')
    
    if out.strip():
        clean_out = out.encode('ascii', 'ignore').decode('ascii')
        print(f"STDOUT:\n{clean_out}")
    if err.strip():
        clean_err = err.encode('ascii', 'ignore').decode('ascii')
        print(f"STDERR:\n{clean_err}")
        
    if exit_status != 0:
        print(f"Command failed with exit code: {exit_status}")
    return exit_status == 0

def deploy():
    # 1. Zip local backend files
    zip_backend()
    
    # 2. Establish SSH connection
    print(f"Connecting to VPS at {HOST}...")
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(HOST, port=PORT, username=USER, password=PASSWORD)
    print("SSH Connection established successfully!")
    
    try:
        # 3. Install initial utilities (unzip, curl)
        print("Installing unzip and curl on the VPS...")
        run_ssh_cmd(ssh, "apt-get update -y && apt-get install -y unzip curl git")
        
        # 4. Check if Node.js v20 is installed, otherwise install it
        print("Checking/Installing Node.js v20...")
        stdin, stdout, stderr = ssh.exec_command("node -v")
        node_version = stdout.read().decode('utf-8').strip()
        if not node_version.startswith("v20"):
            print("Installing Node.js v20 LTS...")
            run_ssh_cmd(ssh, "curl -fsSL https://deb.nodesource.com/setup_20.x | bash -")
            run_ssh_cmd(ssh, "apt-get install -y nodejs")
        else:
            print(f"Node.js {node_version} is already installed!")
            
        # 5. Install PM2 globally
        print("Installing PM2...")
        run_ssh_cmd(ssh, "npm install -g pm2")
        
        # 6. Upload Zip File
        print(f"Uploading {ZIP_PATH} to VPS at {REMOTE_ZIP_PATH}...")
        with SCPClient(ssh.get_transport()) as scp:
            scp.put(ZIP_PATH, REMOTE_ZIP_PATH)
        print("Upload completed!")
        
        # 7. Extract zip file
        print(f"Extracting zip file to {REMOTE_APP_DIR}...")
        run_ssh_cmd(ssh, f"mkdir -p {REMOTE_APP_DIR}")
        run_ssh_cmd(ssh, f"unzip -o {REMOTE_ZIP_PATH} -d {REMOTE_APP_DIR}")
        
        # 8. Install NPM packages
        print("Installing npm dependencies on VPS...")
        run_ssh_cmd(ssh, f"cd {REMOTE_APP_DIR} && npm install")
        
        # 9. Ensure env variables are set to production
        print("Configuring production environment...")
        env_content = ""
        local_env_path = os.path.join(LOCAL_BACKEND_DIR, '.env.backend')
        if os.path.exists(local_env_path):
            with open(local_env_path, 'r') as f:
                for line in f:
                    if line.startswith('PORT='):
                        env_content += "PORT=3041\n"
                    elif line.startswith('NODE_ENV='):
                        env_content += "NODE_ENV=production\n"
                    else:
                        env_content += line
        else:
            print("[Warning] .env.backend file not found locally!")
            
        # Upload .env file
        remote_env_path = os.path.join(REMOTE_APP_DIR, '.env')
        # Use python script on remote server to write .env
        import base64
        encoded_env = base64.b64encode(env_content.encode('utf-8')).decode('utf-8')
        run_ssh_cmd(ssh, f"echo {encoded_env} | base64 -d > {remote_env_path}")
        print(".env configuration written successfully!")
        
        # 10. Configure and start PM2 service
        print("Stopping existing PM2 application if running...")
        run_ssh_cmd(ssh, "pm2 stop codeengine-backend || true")
        run_ssh_cmd(ssh, "pm2 delete codeengine-backend || true")
        
        print("Starting backend with PM2...")
        run_ssh_cmd(ssh, f"cd {REMOTE_APP_DIR} && pm2 start 'npx tsx stripe-server.ts' --name 'codeengine-backend'")
        run_ssh_cmd(ssh, "pm2 save")
        
        # 11. Configure Nginx reverse proxy
        print("Configuring Nginx Reverse Proxy...")
        nginx_config = f"""server {{
    listen 80;
    server_name {DOMAIN};

    location / {{
        proxy_pass http://localhost:3041;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }}
}}"""
        encoded_nginx = base64.b64encode(nginx_config.encode('utf-8')).decode('utf-8')
        run_ssh_cmd(ssh, f"echo {encoded_nginx} | base64 -d > /etc/nginx/sites-available/codeengine-backend")
        run_ssh_cmd(ssh, "ln -sf /etc/nginx/sites-available/codeengine-backend /etc/nginx/sites-enabled/")
        run_ssh_cmd(ssh, "rm -f /etc/nginx/sites-enabled/default")
        run_ssh_cmd(ssh, "nginx -t")
        run_ssh_cmd(ssh, "systemctl restart nginx")
        
        # 12. Configure Certbot SSL Certificate
        print("Configuring Certbot for SSL...")
        run_ssh_cmd(ssh, "apt-get install -y certbot python3-certbot-nginx")
        run_ssh_cmd(ssh, f"certbot --nginx -d {DOMAIN} --non-interactive --agree-tos -m support@codeenginelearn.com || true")
        
        print("\n=======================================================")
        print(f"DEPLOYMENT COMPLETED SUCCESSFULY!")
        print(f"API is running on: https://{DOMAIN}")
        print("=======================================================")
        
    finally:
        ssh.close()
        # Clean up local zip
        if os.path.exists(ZIP_PATH):
            os.remove(ZIP_PATH)

if __name__ == '__main__':
    deploy()
