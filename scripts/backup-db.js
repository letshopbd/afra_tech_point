const fs = require('fs')
const path = require('path')

const DB_FILE = path.join(__dirname, '../prisma/dev.db')
const BACKUP_DIR = path.join(__dirname, '../backups')
const MAX_BACKUPS = 7

function runBackup() {
  console.log('Starting SQLite database backup...')

  // 1. Verify source database exists
  if (!fs.existsSync(DB_FILE)) {
    console.error(`Error: Source database file not found at ${DB_FILE}`)
    return
  }

  // 2. Create backup directory if it doesn't exist
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true })
    console.log(`Created backup directory at: ${BACKUP_DIR}`)
  }

  // 3. Generate backup filename with timestamp
  const now = new Date()
  const timestamp = now.toISOString().replace(/T/, '_').replace(/\..+/, '').replace(/:/g, '-')
  const backupFileName = `backup_dev_${timestamp}.db`
  const backupFilePath = path.join(BACKUP_DIR, backupFileName)

  try {
    // 4. Perform the copy operation
    fs.copyFileSync(DB_FILE, backupFilePath)
    console.log(`Backup created successfully: ${backupFileName}`)

    // 5. Prune old backups (keep only the latest MAX_BACKUPS)
    pruneOldBackups()
  } catch (error) {
    console.error('Failed to create database backup:', error)
  }
}

function pruneOldBackups() {
  try {
    const files = fs.readdirSync(BACKUP_DIR)
    const backupFiles = files
      .filter(file => file.startsWith('backup_dev_') && file.endsWith('.db'))
      .map(file => {
        const filePath = path.join(BACKUP_DIR, file)
        const stat = fs.statSync(filePath)
        return { name: file, path: filePath, mtime: stat.mtime }
      })
      // Sort oldest first
      .sort((a, b) => a.mtime.getTime() - b.mtime.getTime())

    if (backupFiles.length > MAX_BACKUPS) {
      const filesToRemove = backupFiles.slice(0, backupFiles.length - MAX_BACKUPS)
      console.log(`Pruning ${filesToRemove.length} old backup(s)...`)
      
      filesToRemove.forEach(file => {
        fs.unlinkSync(file.path)
        console.log(`Deleted old backup: ${file.name}`)
      })
    }
  } catch (error) {
    console.error('Error pruning old backups:', error)
  }
}

runBackup()
