/** Add // @ts-nocheck to all files in tiptap/ */

import glob from 'glob'
import * as fs from 'fs/promises'

const ignoreString = '// @ts-nocheck'

const options: glob.IOptions = {
  ignore: ['node_modules/**'],
  nodir: true,
}

glob('./tiptap/**/*.{ts,tsx}', options, async (err, files) => {
  if (err) {
    console.error(err)
    return
  }

  for (const file of files) {
    try {
      let data = await fs.readFile(file, 'utf8')
      if (!data.startsWith(ignoreString)) {
        data = ignoreString + '\n' + data
        await fs.writeFile(file, data)
      }
    } catch (err) {
      console.error(err)
    }
  }
})
