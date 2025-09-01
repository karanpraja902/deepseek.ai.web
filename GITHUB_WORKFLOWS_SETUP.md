# GitHub Workflows Setup Guide

This guide explains how to set up and use the GitHub workflows for CI/CD in your DeepSeek AI project.

## 📁 Workflow Structure

The project includes several GitHub workflows:

### Client Workflows (Next.js)
- **`.github/workflows/ci.yml`** - Continuous Integration for the client
- **`.github/workflows/deploy.yml`** - Deployment to production

### Server Workflows (Node.js/Express)
- **`.github/workflows/ci.yml`** - Continuous Integration for the server
- **`.github/workflows/deploy.yml`** - Deployment to production

### Combined Workflows
- **`.github/workflows/combined-ci.yml`** - Runs CI for both client and server
- **`.github/workflows/release.yml`** - Creates releases and uploads artifacts

## 🚀 Quick Setup

### 1. Enable GitHub Actions

1. Go to your GitHub repository
2. Click on the **Actions** tab
3. Click **Enable Actions**

### 2. Configure Repository Secrets

Go to **Settings** → **Secrets and variables** → **Actions** and add the following secrets:

#### For Client Deployment (Vercel)
```
VERCEL_TOKEN          - Your Vercel API token
VERCEL_ORG_ID        - Your Vercel organization ID
VERCEL_PROJECT_ID    - Your Vercel project ID
```

#### For Server Deployment (Railway)
```
RAILWAY_TOKEN        - Your Railway API token
RAILWAY_SERVICE      - Your Railway service name
```

#### Alternative Server Deployment (Render)
```
RENDER_SERVICE_ID    - Your Render service ID
RENDER_API_KEY       - Your Render API key
```

### 3. Configure Branch Protection

1. Go to **Settings** → **Branches**
2. Add rule for `main` branch:
   - ✅ Require status checks to pass before merging
   - ✅ Require branches to be up to date before merging
   - ✅ Select the following status checks:
     - `Client CI / test`
     - `Server CI / test`
     - `Combined CI / client-ci`
     - `Combined CI / server-ci`

## 🔧 Workflow Details

### Client CI Workflow
- **Triggers**: Push/PR to `main` or `develop` branches
- **Actions**:
  - Install dependencies
  - Run ESLint
  - Type checking with TypeScript
  - Build Next.js application
  - Security audit
  - Dependency check

### Server CI Workflow
- **Triggers**: Push/PR to `main` or `develop` branches
- **Actions**:
  - Install dependencies
  - Type checking with TypeScript
  - Build TypeScript to JavaScript
  - Security audit
  - Dependency check
  - Database connection test (MongoDB)

### Deployment Workflows
- **Triggers**: Push to `main` branch only
- **Actions**:
  - Run all CI checks
  - Deploy to production environment
  - Create deployment summary

### Release Workflow
- **Triggers**: Push of version tags (e.g., `v1.0.0`)
- **Actions**:
  - Build both client and server
  - Create GitHub release
  - Upload build artifacts

## 📋 Usage Examples

### Creating a Release

```bash
# Tag and push a new version
git tag v1.0.0
git push origin v1.0.0
```

### Manual Workflow Trigger

1. Go to **Actions** tab
2. Select the workflow you want to run
3. Click **Run workflow**
4. Select branch and click **Run workflow**

### Checking Workflow Status

- **Green checkmark**: All checks passed
- **Red X**: One or more checks failed
- **Yellow dot**: Workflow is running
- **Gray dot**: Workflow is waiting

## 🛠️ Customization

### Adding New Checks

To add new checks to the CI workflow:

```yaml
- name: Run custom check
  run: npm run custom-check
```

### Modifying Deployment

To change deployment platform, update the deploy step in the respective workflow:

```yaml
# For Vercel
- name: Deploy to Vercel
  uses: amondnet/vercel-action@v25
  with:
    vercel-token: ${{ secrets.VERCEL_TOKEN }}
    # ... other options

# For Netlify
- name: Deploy to Netlify
  uses: nwtgck/actions-netlify@v2.0
  with:
    publish-dir: './dist'
    production-branch: main
    github-token: ${{ secrets.GITHUB_TOKEN }}
    deploy-message: "Deploy from GitHub Actions"
```

### Environment-Specific Variables

Add environment variables to your workflows:

```yaml
env:
  NODE_ENV: production
  API_URL: ${{ secrets.API_URL }}
```

## 🔍 Troubleshooting

### Common Issues

1. **Workflow not triggering**
   - Check file paths in `on.paths` section
   - Ensure you're pushing to the correct branch

2. **Build failures**
   - Check Node.js version compatibility
   - Verify all dependencies are installed
   - Check for TypeScript compilation errors

3. **Deployment failures**
   - Verify all required secrets are set
   - Check deployment platform status
   - Ensure build artifacts are generated

4. **Permission errors**
   - Check repository permissions
   - Verify workflow has required permissions

### Debugging

1. **View workflow logs**
   - Click on the workflow run
   - Click on the failed job
   - Check the step logs for errors

2. **Re-run workflows**
   - Go to failed workflow run
   - Click **Re-run jobs** or **Re-run all jobs**

3. **Check artifact downloads**
   - Go to workflow run
   - Scroll down to **Artifacts** section
   - Download and inspect build files

## 📚 Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Vercel GitHub Integration](https://vercel.com/docs/git/vercel-for-github)
- [Railway GitHub Integration](https://docs.railway.app/deploy/deployments/github)
- [Render GitHub Integration](https://render.com/docs/deploy-from-git)

## 🤝 Contributing

When contributing to this project:

1. Create a feature branch from `develop`
2. Make your changes
3. Push to your feature branch
4. Create a pull request to `develop`
5. Ensure all CI checks pass
6. Request review from maintainers

The workflows will automatically run on your pull request to ensure code quality.


