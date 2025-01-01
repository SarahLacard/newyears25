# newyears25

Project for collecting and analyzing conversations and DPO pairs.

## Quick Start
1. Clone the repository
2. Switch to dev-test branch for development
3. Open index.html in your browser

## Project Structure
- index.html: Main entry point
- script.js: Core functionality
- styles.css: Styling
- data/: Data storage
  - conversations/: User conversations
  - dpo/: DPO pair data
- newyears25.worker.js: Cloudflare worker (not tracked in git)

## Development
- Main branch: Production code
- dev-test branch: Development and testing
- Create feature branches from dev-test
- Always commit changes before switching branches

## Data Storage
- Local storage using directory structure
- Data files stored in appropriate /data subdirectories
- Worker file excluded via .gitignore
- Future: SQLite integration planned

## Branch Management
1. Development:
   - Work in dev-test branch
   - Create feature branches for major changes
   - Test thoroughly before merging to main
2. Production:
   - Main branch contains stable code
   - Merge from dev-test when features are complete

## See Also
- [Hub Site](https://sarahlacard.github.io): Project overview and documentation 