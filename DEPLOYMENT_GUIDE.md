# 🚀 Hướng dẫn Deploy lên Vercel

## 📋 Mục lục
- [Cách 1: Deploy từ local bằng Vercel CLI](#cách-1-deploy-từ-local-bằng-vercel-cli-không-cần-github)
- [Cách 2: Deploy với GitHub (Khuyến nghị)](#cách-2-deploy-với-github-khuyến-nghị)
- [Cấu hình Environment Variables](#cấu-hình-environment-variables)
- [Troubleshooting](#troubleshooting)

---

## Cách 1: Deploy từ local bằng Vercel CLI (Không cần GitHub)

### ✅ Ưu điểm
- Deploy ngay từ local machine
- Không cần GitHub repo
- Nhanh gọn, đơn giản

### ❌ Hạn chế
- Mất tính CI/CD tự động
- Mỗi lần deploy phải chạy lệnh thủ công
- Không có preview deployments

### 📝 Các bước thực hiện

#### Bước 1: Cài đặt Vercel CLI

```bash
npm install -g vercel
```

Hoặc dùng npx (không cần cài đặt):
```bash
npx vercel
```

#### Bước 2: Login vào Vercel

```bash
vercel login
```

- Bạn sẽ được redirect đến browser để login
- Chọn login với GitHub, GitLab, Bitbucket, hoặc Email

#### Bước 3: Build project (Optional nhưng khuyến nghị)

```bash
# Di chuyển vào project directory
cd /Users/thanhtranduy/Projects/mai-house-apartment-management

# Build project để test
npm run build
```

#### Bước 4: Deploy lên Vercel

```bash
vercel
```

**Hệ thống sẽ hỏi:**
```
? Set up and deploy "~/Projects/mai-house-apartment-management"? [Y/n] y
? Which scope do you want to deploy to? (chọn account của bạn)
? Link to existing project? [y/N] n
? What's your project's name? (nhập tên, ví dụ: mai-house-apartment)
? In which directory is your code located? ./ (nhấn Enter)
? Want to override the settings? [y/N] n
```

**Vercel sẽ tự động:**
- Nhận diện đây là Vite + React project
- Build project (`npm run build`)
- Upload files
- Cung cấp URL: `https://mai-house-apartment.vercel.app`

#### Bước 5: Deploy production

Lệnh ở trên deploy đến **preview URL**. Để deploy production:

```bash
vercel --prod
```

#### Bước 6: Tương lai - Deploy lại khi có code thay đổi

```bash
# Mỗi lần code thay đổi, chạy:
npm run build
vercel --prod
```

---

## Cách 2: Deploy với GitHub (Khuyến nghị)

### ✅ Ưu điểm
- **CI/CD tự động**: Push code → Auto deploy
- **Preview deployments**: Mỗi PR có preview URL riêng
- **Rollback dễ dàng**: Quay lại bản cũ bất cứ lúc nào
- **Team collaboration**: Nhiều người có thể work cùng lúc
- **Environment variables management**: Quản lý biến môi trường dễ dàng

### 📝 Các bước thực hiện

#### Bước 1: Chuẩn bị GitHub repo

##### 1.1 Tạo GitHub repo mới

**Cách A: Tạo trên GitHub Web**
1. Truy cập https://github.com/new
2. Repository name: `mai-house-apartment-management`
3. Public hoặc Private (tùy chọn)
4. **KHÔNG** check "Add a README file"
5. Click "Create repository"

**Cách B: Tạo bằng GitHub CLI (nếu đã cài gh)**

```bash
gh repo create mai-house-apartment-management --public --source=. --remote=origin --push
```

##### 1.2 Push code lên GitHub

```bash
# Di chuyển vào project directory
cd /Users/thanhtranduy/Projects/mai-house-apartment-management

# Initialize git (nếu chưa có)
git init

# Add remote
git remote add origin https://github.com/TEN_GITHUB_USERNAME/mai-house-apartment-management.git

# Add tất cả files
git add .

# Commit lần đầu
git commit -m "Initial commit: Apartment Management App"

# Push lên GitHub
git push -u origin main
```

#### Bước 2: Kết nối với Vercel

##### 2.1 Đăng nhập Vercel

1. Truy cập https://vercel.com
2. Click "Sign Up" hoặc "Log In"
3. Chọn đăng nhập với GitHub

##### 2.2 Import project

1. Click "Add New..." → "Project"
2. Chọn GitHub repo `mai-house-apartment-management`
3. Vercel sẽ tự động detect configuration:

**Framework Preset:** Vite
**Build Command:** `npm run build`
**Output Directory:** `dist`
**Install Command:** `npm install`

4. Click "Deploy"

**Vercel sẽ:**
- Clone code từ GitHub
- Run `npm install`
- Run `npm run build`
- Deploy lên `https://mai-house-apartment-management.vercel.app`

#### Bước 3: Cấu hình Environment Variables (Quan trọng!)

Trong Vercel Dashboard:

1. Vào project → Settings → Environment Variables
2. Thêm các biến môi trường từ file `.env.local` của bạn:

```bash
# Ví dụ (thay thế với giá trị thực của bạn)
FIREBASE_API_KEY=your_firebase_api_key
FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your_sender_id
FIREBASE_APP_ID=your_app_id
```

3. Chọn môi trường:
   - **Production**: Cho production deployment
   - **Preview**: Cho preview deployments
   - **Development**: Cho development

4. Click "Save"

**⚠️ Lưu ý:**
- **KHÔNG BAO GIỜ** commit file `.env.local` vào GitHub
- Thêm `.env.local` vào `.gitignore` (nếu chưa có)

#### Bước 4: Test deployment

```bash
# Tạo một thay đổi nhỏ để test
echo "# Test CI/CD" >> README.md

# Commit và push
git add .
git commit -m "test: CI/CD deployment"
git push origin main
```

**Kết quả:** Vercel sẽ tự động deploy lại! 🎉

---

## Cấu hình Environment Variables

### Tìm Environment Variables trong project của bạn

```bash
# Xem file .env.local
cat /Users/thanhtranduy/Projects/mai-house-apartment-management/.env.local
```

### Thêm vào Vercel

**Cách 1: Vercel Dashboard**
1. Project → Settings → Environment Variables
2. Click "Add New"
3. Nhập key và value
4. Chọn environments (Production/Preview/Development)
5. Save

**Cách 2: Vercel CLI**

```bash
# Thêm environment variable
vercel env add FIREBASE_API_KEY

# Hệ thống sẽ hỏi giá trị và môi trường
# Sau đó redeploy để áp dụng
vercel --prod
```

---

## Troubleshooting

### ❌ Lỗi: Build fails

**Kiểm tra:**
1. Build locally trước: `npm run build`
2. Xem Build Logs trong Vercel Dashboard
3. Kiểm tra dependencies trong `package.json`

### ❌ Lỗi: Environment variables không work

**Giải pháp:**
1. Đảm bảo đã thêm vào Vercel Dashboard
2. Redeploy sau khi thêm env vars
3. Kiểm tra naming (case-sensitive)

### ❌ Lỗi: White screen sau khi deploy

**Kiểm tra:**
1. Console logs trong browser (F12)
2. Vercel Function Logs
3. Environment variables có đúng không

### ❌ Lỗi: 404 trên routes

**Giải pháp:** Thêm `vercel.json` vào project root:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

---

## 📊 So sánh 2 cách

| Tính năng | CLI (Local) | GitHub Integration |
|-----------|-------------|-------------------|
| CI/CD tự động | ❌ | ✅ |
| Preview deployments | ❌ | ✅ |
| Environment vars | ✅ | ✅ |
| Độ phức tạp | Đơn giản | Phức tạp hơn |
| Best cho | Personal projects | Team projects |

---

## 🎯 Khuyến nghị

### Dùng CLI khi:
- Dự án cá nhân
- Deploy thử nghiệm
- Không muốn dùng GitHub

### Dùng GitHub khi:
- Dự án production
- Team collaboration
- Muốn CI/CD tự động
- Muốn preview deployments

---

## 📞 Support

Nếu gặp lỗi:
1. Kiểm tra [Vercel Docs](https://vercel.com/docs)
2. Xem Build Logs trong Vercel Dashboard
3. Google lỗi cụ thể

---

## 🎉 Hoàn tất!

Sau khi deploy thành công:
- **CLI**: Bạn sẽ nhận được URL như `https://mai-house-apartment.vercel.app`
- **GitHub**: Tự động deploy khi push code

**Happy deploying!** 🚀
