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
        print(f"OUT:\n{out}")
    if err:
        print(f"ERR:\n{err}")

try:
    run("ss -tulpn | grep :80")
    run("ss -tulpn | grep :443")
    run("pm2 status")
finally:
    ssh.close()
