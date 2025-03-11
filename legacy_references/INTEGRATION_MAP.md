# Legacy Project Integration Map

This document maps the legacy project files to their reference locations and describes their relevance to FlowChat.

## Configuration Files

### Environment & Security
- `.env.example` → `config/env/env.example`
  - Template for required environment variables
  - Security configuration patterns
  - API integration settings

### Next.js Configuration
- `next.config.js` → `config/next/next.config.reference.js`
  - Image optimization settings
  - API route configuration
  - CORS settings
  - Security headers

### TypeScript & Build
- `tsconfig.json` → `config/next/tsconfig.reference.json`
  - TypeScript configuration
  - Path aliases
  - Build settings

### Development Tools
- `.eslintrc.json` → `config/next/eslint.reference.json`
  - Code style rules
  - TypeScript integration
  - React best practices

- `postcss.config.js` → `config/next/postcss.reference.js`
  - CSS processing
  - Tailwind integration

- `tailwind.config.js` → `config/next/tailwind.reference.js`
  - UI framework configuration
  - Tremor integration
  - Color schemes

## Documentation

### Project Status
- `SERVICE_STATUS.md` → `docs/status/service-status.reference.md`
  - Service implementation status
  - Integration checkpoints
  - Known issues and solutions

### Project Structure
- `.cursorrules` → `docs/structure.reference.md`
  - Directory organization
  - Code conventions
  - Architecture patterns

## Dependencies

### Package Management
- `package.json` → `config/next/package.reference.json`
  - Required dependencies
  - Development tools
  - Scripts and commands

## Integration Guidelines

1. **Configuration Files**
   - Review and adapt environment variables
   - Update security settings
   - Modernize build configurations

2. **Documentation**
   - Use as reference for service implementation
   - Follow established patterns
   - Improve based on lessons learned

3. **Dependencies**
   - Evaluate package versions
   - Check for security updates
   - Consider alternatives where appropriate

## Security Notes

- Remove all sensitive information
- Update API keys and endpoints
- Review security configurations
- Implement latest security best practices

## Next Steps

1. Create clean copies of reference files
2. Remove sensitive information
3. Document integration patterns
4. Update configurations for FlowChat
5. Implement improved security measures 