#!/bin/bash

# KALXJS Framework Developer Tools
# This shell script provides an easy interface for common development tasks

# Set colors
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
MAGENTA='\033[0;35m'
BLUE='\033[0;34m'
WHITE='\033[0;37m'
BRIGHT='\033[1m'
RESET='\033[0m'

# Set framework directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
FRAMEWORK_DIR="$SCRIPT_DIR/KALXJS-FRAMEWORK"

# Check if we're in the right directory
if [ ! -d "$FRAMEWORK_DIR" ]; then
    echo -e "${RED}Error: KALXJS-FRAMEWORK directory not found.${RESET}"
    echo "Please run this script from the root of the kaljs repository."
    exit 1
fi

# Display header
clear
echo -e "${CYAN}${BRIGHT}"
echo " _  __    _    _     __  __     _  ____    _____ ____      _    __  __ _______        _____  ____  _  __"
echo "| |/ /   / \  | |   \ \/ /    | |/ ___|  |  ___|  _ \    / \  |  \/  |  ___\ \      / / _ \|  _ \| |/ /"
echo "| ' /   / _ \ | |    \  /_____| |\___ \  | |_  | |_) |  / _ \ | |\/| | |_   \ \ /\ / / | | | |_) | ' / "
echo "| . \  / ___ \| |___ /  \|_____| | ___) | |  _| |  _ <  / ___ \| |  | |  _|   \ V  V /| |_| |  _ <| . \ "
echo "|_|\_\/_/   \_\|_____/_/\_\     |_||____/  |_|   |_| \_\/_/   \_\_|  |_|_|      \_/\_/  \___/|_| \_\_|\_\\"
echo ""
echo -e "${RESET}${BRIGHT}Developer Tools${RESET}"
echo ""

# Main menu function
main_menu() {
    echo -e "${CYAN}${BRIGHT}Choose an operation:${RESET}"
    echo ""
    echo -e "${WHITE}${BRIGHT}[1]${RESET} ${GREEN}Build Framework${RESET}        - Build all packages"
    echo -e "${WHITE}${BRIGHT}[2]${RESET} ${GREEN}Build Package${RESET}         - Build a specific package"
    echo -e "${WHITE}${BRIGHT}[3]${RESET} ${YELLOW}Clean${RESET}                - Clean node_modules and build artifacts"
    echo -e "${WHITE}${BRIGHT}[4]${RESET} ${BLUE}Install Dependencies${RESET}   - Install all dependencies"
    echo -e "${WHITE}${BRIGHT}[5]${RESET} ${MAGENTA}Run Tests${RESET}             - Run test suite"
    echo -e "${WHITE}${BRIGHT}[6]${RESET} ${CYAN}Create Project${RESET}        - Create a new KALXJS project"
    echo -e "${WHITE}${BRIGHT}[7]${RESET} ${YELLOW}Lint Code${RESET}            - Run ESLint on all packages"
    echo -e "${WHITE}${BRIGHT}[8]${RESET} ${GREEN}Publish${RESET}              - Publish packages to npm"
    echo -e "${WHITE}${BRIGHT}[9]${RESET} ${BLUE}Documentation${RESET}        - Build or serve documentation"
    echo -e "${WHITE}${BRIGHT}[10]${RESET} ${RED}Exit${RESET}                 - Exit this tool"
    echo ""

    read -p "Enter your choice (1-10): " choice
    echo ""

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
            echo -e "${RED}Invalid choice. Please try again.${RESET}"
            sleep 2
            clear
            main_menu
            ;;
    esac
}

# Build all packages
build_all() {
    echo -e "${CYAN}${BRIGHT}Building all packages...${RESET}"
    cd "$FRAMEWORK_DIR"
    npm run build
    echo ""
    echo -e "${GREEN}Build complete!${RESET}"
    read -p "Press Enter to continue..."
    clear
    main_menu
}

# Build specific package
build_package() {
    echo -e "${CYAN}${BRIGHT}Select a package to build:${RESET}"
    echo ""
    echo -e "${WHITE}${BRIGHT}[1]${RESET} Core"
    echo -e "${WHITE}${BRIGHT}[2]${RESET} Router"
    echo -e "${WHITE}${BRIGHT}[3]${RESET} State"
    echo -e "${WHITE}${BRIGHT}[4]${RESET} CLI"
    echo -e "${WHITE}${BRIGHT}[5]${RESET} DevTools"
    echo -e "${WHITE}${BRIGHT}[6]${RESET} Composition"
    echo -e "${WHITE}${BRIGHT}[7]${RESET} Performance"
    echo -e "${WHITE}${BRIGHT}[8]${RESET} Plugins"
    echo -e "${WHITE}${BRIGHT}[9]${RESET} API"
    echo -e "${WHITE}${BRIGHT}[10]${RESET} Back to main menu"
    echo ""

    read -p "Enter your choice (1-10): " pkg_choice
    echo ""

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
            echo -e "${RED}Invalid choice. Please try again.${RESET}"
            sleep 2
            clear
            build_package
            return
            ;;
    esac

    echo -e "${CYAN}${BRIGHT}Building ${pkg_name} package...${RESET}"
    cd "$FRAMEWORK_DIR"
    npm run build:${pkg_name}
    echo ""
    echo -e "${GREEN}Build complete!${RESET}"
    read -p "Press Enter to continue..."
    clear
    main_menu
}

# Clean
clean() {
    echo -e "${YELLOW}${BRIGHT}Cleaning node_modules and build artifacts...${RESET}"
    cd "$FRAMEWORK_DIR"
    npm run clean
    echo ""
    echo -e "${GREEN}Clean complete!${RESET}"
    read -p "Press Enter to continue..."
    clear
    main_menu
}

# Install dependencies
install() {
    echo -e "${BLUE}${BRIGHT}Installing dependencies...${RESET}"
    cd "$FRAMEWORK_DIR"
    npm install
    echo ""
    echo -e "${GREEN}Installation complete!${RESET}"
    read -p "Press Enter to continue..."
    clear
    main_menu
}

# Run tests
tests() {
    echo -e "${MAGENTA}${BRIGHT}Select test option:${RESET}"
    echo ""
    echo -e "${WHITE}${BRIGHT}[1]${RESET} Run all tests"
    echo -e "${WHITE}${BRIGHT}[2]${RESET} Run tests with watch mode"
    echo -e "${WHITE}${BRIGHT}[3]${RESET} Run tests with coverage"
    echo -e "${WHITE}${BRIGHT}[4]${RESET} Clear Jest cache"
    echo -e "${WHITE}${BRIGHT}[5]${RESET} Back to main menu"
    echo ""

    read -p "Enter your choice (1-5): " test_choice
    echo ""

    case $test_choice in
        1)
            echo -e "${MAGENTA}${BRIGHT}Running all tests...${RESET}"
            cd "$FRAMEWORK_DIR"
            npm test
            ;;
        2)
            echo -e "${MAGENTA}${BRIGHT}Running tests in watch mode...${RESET}"
            cd "$FRAMEWORK_DIR"
            npm run test:watch
            ;;
        3)
            echo -e "${MAGENTA}${BRIGHT}Running tests with coverage...${RESET}"
            cd "$FRAMEWORK_DIR"
            npm run test:coverage
            ;;
        4)
            echo -e "${MAGENTA}${BRIGHT}Clearing Jest cache...${RESET}"
            cd "$FRAMEWORK_DIR"
            npm run clear-jest-cache
            ;;
        5)
            clear
            main_menu
            return
            ;;
        *)
            echo -e "${RED}Invalid choice. Please try again.${RESET}"
            sleep 2
            clear
            tests
            return
            ;;
    esac

    echo ""
    echo -e "${GREEN}Tests complete!${RESET}"
    read -p "Press Enter to continue..."
    clear
    main_menu
}

# Create project
create_project() {
    echo -e "${CYAN}${BRIGHT}Create a new KALXJS project${RESET}"
    echo ""
    read -p "Enter project name: " project_name

    if [ -z "$project_name" ]; then
        echo -e "${RED}Project name cannot be empty.${RESET}"
        sleep 2
        clear
        create_project
        return
    fi

    echo ""
    echo -e "${CYAN}Select features to include:${RESET}"
    echo ""
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

    echo ""
    echo -e "${CYAN}${BRIGHT}Creating project ${project_name}...${RESET}"
    cd "$FRAMEWORK_DIR"
    npm run create -- "$project_name" $options
    echo ""
    echo -e "${GREEN}Project created!${RESET}"
    read -p "Press Enter to continue..."
    clear
    main_menu
}

# Lint code
lint() {
    echo -e "${YELLOW}${BRIGHT}Linting code...${RESET}"
    cd "$FRAMEWORK_DIR"
    npm run lint
    echo ""
    echo -e "${GREEN}Linting complete!${RESET}"
    read -p "Press Enter to continue..."
    clear
    main_menu
}

# Publish packages
publish() {
    echo -e "${GREEN}${BRIGHT}Select publish option:${RESET}"
    echo ""
    echo -e "${WHITE}${BRIGHT}[1]${RESET} Publish all packages"
    echo -e "${WHITE}${BRIGHT}[2]${RESET} Publish from package"
    echo -e "${WHITE}${BRIGHT}[3]${RESET} Publish canary version"
    echo -e "${WHITE}${BRIGHT}[4]${RESET} Bump version"
    echo -e "${WHITE}${BRIGHT}[5]${RESET} Back to main menu"
    echo ""

    read -p "Enter your choice (1-5): " publish_choice
    echo ""

    case $publish_choice in
        1)
            echo -e "${GREEN}${BRIGHT}Publishing all packages...${RESET}"
            cd "$FRAMEWORK_DIR"
            npm run publish
            ;;
        2)
            echo -e "${GREEN}${BRIGHT}Publishing from package...${RESET}"
            cd "$FRAMEWORK_DIR"
            npm run publish:from-package
            ;;
        3)
            echo -e "${GREEN}${BRIGHT}Publishing canary version...${RESET}"
            cd "$FRAMEWORK_DIR"
            npm run publish:canary
            ;;
        4)
            echo -e "${GREEN}${BRIGHT}Bumping version...${RESET}"
            cd "$FRAMEWORK_DIR"
            npm run version:bump
            ;;
        5)
            clear
            main_menu
            return
            ;;
        *)
            echo -e "${RED}Invalid choice. Please try again.${RESET}"
            sleep 2
            clear
            publish
            return
            ;;
    esac

    echo ""
    echo -e "${GREEN}Publish operation complete!${RESET}"
    read -p "Press Enter to continue..."
    clear
    main_menu
}

# Documentation
documentation() {
    echo -e "${BLUE}${BRIGHT}Select documentation option:${RESET}"
    echo ""
    echo -e "${WHITE}${BRIGHT}[1]${RESET} Start documentation dev server"
    echo -e "${WHITE}${BRIGHT}[2]${RESET} Build documentation"
    echo -e "${WHITE}${BRIGHT}[3]${RESET} Deploy documentation"
    echo -e "${WHITE}${BRIGHT}[4]${RESET} Back to main menu"
    echo ""

    read -p "Enter your choice (1-4): " docs_choice
    echo ""

    case $docs_choice in
        1)
            echo -e "${BLUE}${BRIGHT}Starting documentation dev server...${RESET}"
            cd "$FRAMEWORK_DIR"
            npm run docs:dev
            ;;
        2)
            echo -e "${BLUE}${BRIGHT}Building documentation...${RESET}"
            cd "$FRAMEWORK_DIR"
            npm run docs:build
            ;;
        3)
            echo -e "${BLUE}${BRIGHT}Deploying documentation...${RESET}"
            cd "$FRAMEWORK_DIR"
            npm run docs:deploy
            ;;
        4)
            clear
            main_menu
            return
            ;;
        *)
            echo -e "${RED}Invalid choice. Please try again.${RESET}"
            sleep 2
            clear
            documentation
            return
            ;;
    esac

    echo ""
    echo -e "${GREEN}Documentation operation complete!${RESET}"
    read -p "Press Enter to continue..."
    clear
    main_menu
}

# Exit
exit_script() {
    echo -e "${CYAN}${BRIGHT}Thank you for using KALXJS Developer Tools!${RESET}"
    echo ""
    exit 0
}

# Start the main menu
main_menu