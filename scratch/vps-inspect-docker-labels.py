import paramiko

HOST = '153.92.223.162'
USER = 'root'
PASSWORD = 'JUNIOR.com0007'

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(HOST, username=USER, password=PASSWORD)

def run(cmd):
    print(f"--- Running: {cmd} ---")
    stdin, stdout, stderr = ssh.exec_command(cmd)
    out = stdout.read().decode('utf-8', errors='ignore').strip()
    err = stderr.read().decode('utf-8', errors='ignore').strip()
    if out:
        clean_out = out.encode('ascii', 'ignore').decode('ascii')
        print(f"OUT:\n{clean_out}")
    if err:
        clean_err = err.encode('ascii', 'ignore').decode('ascii')
        print(f"ERR:\n{clean_err}")

try:
    # Get labels for n8n container to see domain/routing setup
    run("docker inspect n8n-ep3w-n8n-1 --format '{{json .Config.Labels}}'")
    # Let's search for docker-compose files in the system to see how things are structured
    run("find / -name 'docker-compose.yml' -o -name 'docker-compose.yaml' 2>/dev/null | grep -v '/var/lib/docker'")
finally:
    ssh.close()
