# kalxjs CLI

Command Line Interface for kalxjs framework, designed to help developers create, scaffold, and manage kalxjs applications.

## Installation

```bash
npm install -g @kalxjs/cli
```

## Usage

### Create a new project

```bash
kalxjs create my-app
```

This will create a new kalxjs project in a directory called `my-app`.

### Generate a component

```bash
kalxjs component MyComponent
```

This will create a new component in the `src/components` directory.

### Start development server

```bash
kalxjs serve
```

Starts a development server with hot-reload.

### Build for production

```bash
kalxjs build
```

Compiles and minifies the application for production.

## Options

### Create

```bash
kalxjs create my-app [options]
```

Options:
- `--skip-install`: Skip installing dependencies

### Serve

```bash
kalxjs serve [options]
```

Options:
- `--port <port-number>`: Specify port (default: 3000)

### Component

```bash
kalxjs component MyComponent [options]
```

Options:
- `--dir <directory>`: Specify directory for the component (default: src/components)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.