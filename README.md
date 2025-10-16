# Overwrite Env File

This GitHub Action allows you to overwrite the contents of an environment file with the contents of another file. It is useful when you want to promote/stage environment variables from one environment to another (for example, from a `.env.development` file to a `.env.production` file) automatically in your workflows.

## Usage

```yaml
- name: Overwrite production env file with development env file
  uses: dev-five-git/overwrite-env-file-action@v1
  with:
    input: .env.development
    output: .env.production
```

#### Inputs

| Name         | Description                  | Required | Default             |
|--------------|------------------------------|----------|---------------------|
| input   | The file to read from        | true     | .env.development    |
| output  | The file to overwrite to     | true     | .env.production     |

## Example Workflow

```yaml
name: Promote env to production

on:
  push:
    branches: [main, dev]

jobs:
  promote-env:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Overwrite production env file with development env file
        uses: dev-five-git/overwrite-env-file-action@v1
        if: github.ref_name == 'dev'
```
