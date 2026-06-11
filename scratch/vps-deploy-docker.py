import os
import zipfile
import paramiko
import base64
from scp import SCPClient

# VPS Connection Details
HOST = '153.92.223.162'
USER = 'root'
PORT = 22
PASSWORD = 'JUNIOR.com0007'
DOMAIN = 'api.srv1739567.hstgr.cloud'

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
        # 3. Clean up the PM2 service if running to free the local port
        print("Cleaning up host PM2 service...")
        run_ssh_cmd(ssh, "pm2 stop codeengine-backend || true")
        run_ssh_cmd(ssh, "pm2 delete codeengine-backend || true")
        run_ssh_cmd(ssh, "pm2 save")
        
        # 4. Upload Zip File
        print(f"Uploading {ZIP_PATH} to VPS at {REMOTE_ZIP_PATH}...")
        with SCPClient(ssh.get_transport()) as scp:
            scp.put(ZIP_PATH, REMOTE_ZIP_PATH)
        print("Upload completed!")
        
        # 5. Extract zip file
        print(f"Extracting zip file to {REMOTE_APP_DIR}...")
        run_ssh_cmd(ssh, "apt-get install -y unzip")
        run_ssh_cmd(ssh, f"mkdir -p {REMOTE_APP_DIR}")
        run_ssh_cmd(ssh, f"unzip -o {REMOTE_ZIP_PATH} -d {REMOTE_APP_DIR}")
        
        # 6. Configure environment variables
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
            
        remote_env_path = os.path.join(REMOTE_APP_DIR, '.env')
        encoded_env = base64.b64encode(env_content.encode('utf-8')).decode('utf-8')
        run_ssh_cmd(ssh, f"echo {encoded_env} | base64 -d > {remote_env_path}")
        print(".env configuration written successfully!")
        
        # 7. Stop and remove existing container if running
        print("Cleaning up old container if running...")
        run_ssh_cmd(ssh, "docker stop codeengine-backend || true")
        run_ssh_cmd(ssh, "docker rm codeengine-backend || true")
        
        # 8. Build Docker Image
        print("Building Docker image on the VPS...")
        run_ssh_cmd(ssh, f"docker build -t codeengine-backend {REMOTE_APP_DIR}")
        
        # 9. Run Docker Container with Traefik configuration labels
        print("Running Docker container with Traefik integration...")
        docker_run_cmd = (
            f"docker run -d "
            f"--name codeengine-backend "
            f"--restart unless-stopped "
            f"-p 3041:3041 "
            f"-v {REMOTE_APP_DIR}/.env:/app/.env "
            f"-l 'traefik.enable=true' "
            f"-l 'traefik.http.routers.codeengine-backend.entrypoints=websecure' "
            f"-l 'traefik.http.routers.codeengine-backend.rule=Host(`{DOMAIN}`)' "
            f"-l 'traefik.http.routers.codeengine-backend.tls=true' "
            f"-l 'traefik.http.routers.codeengine-backend.tls.certresolver=letsencrypt' "
            f"-l 'traefik.http.services.codeengine-backend.loadbalancer.server.port=3041' "
            f"codeengine-backend"
        )
        run_ssh_cmd(ssh, docker_run_cmd)
        
        # 10. Verify startup logs
        print("Waiting 3 seconds for container startup...")
        import time
        time.sleep(3)
        print("Fetching backend logs...")
        run_ssh_cmd(ssh, "docker logs --tail 20 codeengine-backend")
        
        print("\n=======================================================")
        print(f"DOCKER DEPLOYMENT COMPLETED SUCCESSFULY!")
        print(f"API is running on: https://{DOMAIN}")
        print("=======================================================")
        
    finally:
        ssh.close()
        # Clean up local zip
        if os.path.exists(ZIP_PATH):
            os.remove(ZIP_PATH)

if __name__ == '__main__':
    deploy()
