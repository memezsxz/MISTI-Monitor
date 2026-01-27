## Getting Started

First, run the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Debug Database Issues
in case of database error delete the database file and recreate it
```bash
rm src/db/database.db
touch src/db/database.db
```

then run the migration and seed
```bash
npm run db:gen
npm run db:migrate
npm run db:seed
```

## AI Issues

first install ollama [https://ollama.com](https://ollama.com/)

install deepseek and server
```bash
ollama pull deepseek-r1:1.5b
ollama serve
```

use ```deepseek-r1:8b``` for better results