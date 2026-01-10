# HTTPS 配置指南

本指南说明如何为 Warlord Chess 配置 HTTPS（SSL/TLS）。

## 方案一：使用 Let's Encrypt 免费证书（推荐）

### 1. 安装 Certbot

在服务器上安装 Certbot：

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install certbot

# CentOS/RHEL
sudo yum install certbot
```

### 2. 获取 SSL 证书

#### 如果你有域名：

```bash
# 停止 nginx 容器以释放 80 和 443 端口
docker compose stop nginx

# 获取证书（将 yourdomain.com 替换为你的实际域名）
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

# 重新启动 nginx
docker compose start nginx
```

#### 如果只有 IP 地址（无域名）：

Let's Encrypt 不支持为 IP 地址颁发证书。你可以使用以下替代方案：
- 购买域名并配置 DNS 指向你的服务器 IP
- 使用自签名证书（方案二）

### 3. 创建 SSL 目录并复制证书

```bash
# 创建 ssl 目录
mkdir -p ssl

# 复制证书（使用你的实际域名）
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem ssl/
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem ssl/

# 设置权限
sudo chown -R $USER:$USER ssl/
chmod 644 ssl/fullchain.pem
chmod 600 ssl/privkey.pem
```

### 4. 更新 Nginx 配置

编辑 `nginx.conf`，添加 HTTPS 服务器配置：

```nginx
# 在 http 块中添加 HTTPS 服务器
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    # SSL 证书配置
    ssl_certificate /etc/nginx/ssl/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/privkey.pem;

    # SSL 安全配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # 安全头部
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # 其他配置与 HTTP 相同
    location / {
        proxy_pass http://warlord_chess_backend;
        # ... 其他配置
    }
}

# HTTP 到 HTTPS 重定向
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}
```

### 5. 自动续期证书

Let's Encrypt 证书有效期为 90 天，需要自动续期：

```bash
# 测试续期
sudo certbot renew --dry-run

# 设置 cron 任务自动续期
sudo crontab -e
```

添加以下行：

```
0 3 * * * certbot renew --quiet --post-hook "docker compose restart nginx"
```

## 方案二：自签名证书（仅用于测试）

### 生成自签名证书

```bash
mkdir -p ssl
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ssl/privkey.pem \
  -out ssl/fullchain.pem \
  -subj "/CN=47.121.129.139"
```

### 更新环境变量

编辑 `.env.production`：

```env
NEXT_PUBLIC_APP_URL=https://47.121.129.139
```

### 更新 nginx.conf

添加与方案一相同的 HTTPS 配置。

### 重启服务

```bash
docker compose restart nginx
```

**注意**：自签名证书会导致浏览器显示安全警告，不推荐用于生产环境。

## 方案三：购买商业证书

1. 从可信的证书颁发机构（CA）购买证书
2. 按照 CA 提供的说明生成 CSR（证书签名请求）
3. 下载证书文件
4. 按照方案一的步骤配置

## 验证 HTTPS 配置

```bash
# 检查 443 端口
curl -I https://47.121.129.139

# 或使用浏览器访问
# https://47.121.129.139
```

## 故障排除

### 证书权限问题

```bash
sudo chmod 644 ssl/fullchain.pem
sudo chmod 600 ssl/privkey.pem
```

### 端口被占用

```bash
# 检查端口占用
sudo netstat -tulpn | grep :80
sudo netstat -tulpn | grep :443

# 停止占用端口的进程
sudo systemctl stop nginx  # 如果系统 nginx 在运行
```

### 查看日志

```bash
# 查看 nginx 日志
docker compose logs nginx

# 查看应用日志
docker compose logs warlord-chess
```

## 安全建议

1. **使用强密码**：确保所有服务使用强密码
2. **定期更新**：保持系统和容器镜像更新
3. **防火墙配置**：只开放必要的端口（80, 443）
4. **监控日志**：定期检查访问日志和错误日志
5. **备份证书**：妥善备份 SSL 证书和私钥
