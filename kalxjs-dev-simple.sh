#!/bin/bash

# KALXJS Framework Developer Tools
# This shell script provides an easy interface for common development tasks

# Set framework directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
FRAMEWORK_DIR="$SCRIPT_DIR/KALXJS-FRAMEWORK"

# Check if we're in the right directory
if [ ! -d "$FRAMEWORK_DIR" ]; then
    echo "Error: KALXJS-FRAMEWORK directory not found."
    echo "Please run this script from the root of the kaljs repository."
    exit 1
fi

# Display header
clear
echo
echo " KALXJS FRAMEWORK DEVELOPER TOOLS"
echo " ==============================="
echo

# Main menu function
main_menu() {
    echo "Choose an operation:"
    echo
    echo "[1] Build Framework        - Build all packages"
    echo "[2] Build Package         - Build a specific package"
    echo "[3] Clean                - Clean node_modules and build artifacts"
    echo "[4] Install Dependencies   - Install all dependencies"
    echo "[5] Run Tests             - Run test suite"
    echo "[6] Create Project        - Create a new KALXJS project"
    echo "[7] Lint Code            - Run ESLint on all packages"
    echo "[8] Publish              - Publish packages to npm"
    echo "[9] Documentation        - Build or serve documentation"
    echo "[10] Exit                 - Exit this tool"
    echo

    read -p "Enter your choice (1-10): " choice
    echo

    case $choice in
        1) build_all ;;
        2) build_package ;;
        3) clean ;;
        4) install ;;
        5) tests ;;
        6) create_project ;;
        7) lint ;;
        8) publish ;;
        9) documentation ;;
        10) exit_script ;;
        *) 
            echo "Invalid choice. Please try again."
            sleep 2
            clear
            main_menu
            ;;
    esac
}

# Build all packages
build_all() {
    echo "Building all packages..."
    cd "$FRAMEWORK_DIR"
    npm run build
    echo
    echo "Build complete!"
    read -p "Press Enter to continue..."
    clear
    main_menu
}

# Build specific package
build_package() {
    echo "Select a package to build:"
    echo
    echo "[1] Core"
    echo "[2] Router"
    echo "[3] State"
    echo "[4] CLI"
    echo "[5] DevTools"
    echo "[6] Composition"
    echo "[7] Performance"
    echo "[8] Plugins"
    echo "[9] API"
    echo "[10] Back to main menu"
    echo

    read -p "Enter your choice (1-10): " pkg_choice
    echo

    case $pkg_choice in
        1) pkg_name="core" ;;
        2) pkg_name="router" ;;
        3) pkg_name="state" ;;
        4) pkg_name="cli" ;;
        5) pkg_name="devtools" ;;
        6) pkg_name="composition" ;;
        7) pkg_name="performance" ;;
        8) pkg_name="plugins" ;;
        9) pkg_name="api" ;;
        10) 
            clear
            main_menu
            return
            ;;
        *) 
            echo "Invalid choice. Please try again."
            sleep 2
            clear
            build_package
            return
            ;;
    esac

    echo "Building ${pkg_name} package..."
    cd "$FRAMEWORK_DIR"
    npm run build:${pkg_name}
    echo
    echo "Build complete!"
    read -p "Press Enter to continue..."
    clear
    main_menu
}

# Clean
clean() {
    echo "Cleaning node_modules and build artifacts..."
    cd "$FRAMEWORK_DIR"
    npm run clean
    echo
    echo "Clean complete!"
    read -p "Press Enter to continue..."
    clear
    main_menu
}

# Install dependencies
install() {
    echo "Installing dependencies..."
    cd "$FRAMEWORK_DIR"
    npm install
    echo
    echo "Installation complete!"
    read -p "Press Enter to continue..."
    clear
    main_menu
}

# Run tests
tests() {
    echo "Select test option:"
    echo
    echo "[1] Run all tests"
    echo "[2] Run tests with watch mode"
    echo "[3] Run tests with coverage"
    echo "[4] Clear Jest cache"
    echo "[5] Back to main menu"
    echo

    read -p "Enter your choice (1-5): " test_choice
    echo

    case $test_choice in
        1)
            echo "Running all tests..."
            cd "$FRAMEWORK_DIR"
            npm test
            ;;
        2)
            echo "Running tests in watch mode..."
            cd "$FRAMEWORK_DIR"
            npm run test:watch
            ;;
        3)
            echo "Running tests with coverage..."
            cd "$FRAMEWORK_DIR"
            npm run test:coverage
            ;;
        4)
            echo "Clearing Jest cache..."
            cd "$FRAMEWORK_DIR"
            npm run clear-jest-cache
            ;;
        5)
            clear
            main_menu
            return
            ;;
        *)
            echo "Invalid choice. Please try again."
            sleep 2
            clear
            tests
            return
            ;;
    esac

    echo
    echo "Tests complete!"
    read -p "Press Enter to continue..."
    clear
    main_menu
}

# Create project
create_project() {
    echo "Create a new KALXJS project"
    echo
    read -p "Enter project name: " project_name

    if [ -z "$project_name" ]; then
        echo "Project name cannot be empty."
        sleep 2
        clear
        create_project
        return
    fi

    echo
    echo "Select features to include:"
    echo
    read -p "Include router? (y/n): " use_router
    read -p "Include state management? (y/n): " use_state
    read -p "Include SCSS support? (y/n): " use_scss
    read -p "Include testing setup? (y/n): " use_testing
    read -p "Include linting? (y/n): " use_linting

    options=""
    if [[ "$use_router" == "y" || "$use_router" == "Y" ]]; then
        options="$options --router"
    fi
    if [[ "$use_state" == "y" || "$use_state" == "Y" ]]; then
        options="$options --state"
    fi
    if [[ "$use_scss" == "y" || "$use_scss" == "Y" ]]; then
        options="$options --scss"
    fi
    if [[ "$use_testing" == "y" || "$use_testing" == "Y" ]]; then
        options="$options --testing"
    fi
    if [[ "$use_linting" == "y" || "$use_linting" == "Y" ]]; then
        options="$options --linting"
    fi

    echo
    echo "Creating project ${project_name}..."
    cd "$FRAMEWORK_DIR"
    npm run create -- "$project_name" $options
    echo
    echo "Project created!"
    read -p "Press Enter to continue..."
    clear
    main_menu
}

# Lint code
lint() {
    echo "Linting code..."
    cd "$FRAMEWORK_DIR"
    npm run lint
    echo
    echo "Linting complete!"
    read -p "Press Enter to continue..."
    clear
    main_menu
}

# Publish packages
publish() {
    echo "Select publish option:"
    echo
    echo "[1] Publish all packages"
    echo "[2] Publish from package"
    echo "[3] Publish canary version"
    echo "[4] Bump version"
    echo "[5] Back to main menu"
    echo

    read -p "Enter your choice (1-5): " publish_choice
    echo

    case $publish_choice in
        1)
            echo "Publishing all packages..."
            cd "$FRAMEWORK_DIR"
            npm run publish
            ;;
        2)
            echo "Publishing from package..."
            cd "$FRAMEWORK_DIR"
            npm run publish:from-package
            ;;
        3)
            echo "Publishing canary version..."
            cd "$FRAMEWORK_DIR"
            npm run publish:canary
            ;;
        4)
            echo "Bumping version..."
            cd "$FRAMEWORK_DIR"
            npm run version:bump
            ;;
        5)
            clear
            main_menu
            return
            ;;
        *)
            echo "Invalid choice. Please try again."
            sleep 2
            clear
            publish
            return
            ;;
    esac

    echo
    echo "Publish operation complete!"
    read -p "Press Enter to continue..."
    clear
    main_menu
}

# Documentation
documentation() {
    echo "Select documentation option:"
    echo
    echo "[1] Start documentation dev server"
    echo "[2] Build documentation"
    echo "[3] Deploy documentation"
    echo "[4] Back to main menu"
    echo

    read -p "Enter your choice (1-4): " docs_choice
    echo

    case $docs_choice in
        1)
            echo "Starting documentation dev server..."
            cd "$FRAMEWORK_DIR"
            npm run docs:dev
            ;;
        2)
            echo "Building documentation..."
            cd "$FRAMEWORK_DIR"
            npm run docs:build
            ;;
        3)
            echo "Deploying documentation..."
            cd "$FRAMEWORK_DIR"
            npm run docs:deploy
            ;;
        4)
            clear
            main_menu
            return
            ;;
        *)
            echo "Invalid choice. Please try again."
            sleep 2
            clear
            documentation
            return
            ;;
    esac

    echo
    echo "Documentation operation complete!"
    read -p "Press Enter to continue..."
    clear
    main_menu
}

# Exit
exit_script() {
    echo "Thank you for using KALXJS Developer Tools!"
    echo
    exit 0
}

# Start the main menu
main_menu