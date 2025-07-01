#!/bin/bash

# KalxJS Development Tools - Quick Start Script for Unix/Linux/macOS
# This script provides a quick way to get started with KalxJS development

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}  KalxJS Development Tools Quick Start${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️ $1${NC}"
}

# Check prerequisites
check_prerequisites() {
    print_info "Checking prerequisites..."

    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed or not in PATH"
        echo "Please install Node.js from https://nodejs.org/"
        exit 1
    fi

    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed or not in PATH"
        echo "Please install npm or check your Node.js installation"
        exit 1
    fi

    print_success "Node.js and npm are available"
    echo "  Node.js: $(node --version)"
    echo "  npm: $(npm --version)"
}

# Show menu
show_menu() {
    echo -e "\nChoose an option:\n"
    echo "1. Setup local testing environment"
    echo "2. Start test applications"
    echo "3. Clean unused files (dry run)"
    echo "4. Analyze dependencies"
    echo "5. Check environment status"
    echo "6. Show help"
    echo "7. Exit"
    echo
}

# Setup local testing environment
setup_environment() {
    echo
    print_info "Setting up local testing environment..."
    echo "This will:"
    echo "  - Clean previous installations"
    echo "  - Build and link packages"
    echo "  - Create test applications"
    echo "  - Setup development servers"
    echo

    read -p "Continue? (y/N): " -n 1 -r
    echo

    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        return
    fi

    if npm run dev:setup; then
        echo
        print_success "Setup completed successfully!"
        echo
        echo "Test applications are available at:"
        echo "  - Basic Test:       http://localhost:3001"
        echo "  - SFC Test:         http://localhost:3002"
        echo "  - Router Test:      http://localhost:3003"
        echo "  - Performance Test: http://localhost:3004"
        echo
    else
        echo
        print_error "Setup failed. Check the logs for details."
    fi

    read -p "Press Enter to continue..."
}

# Start test applications
start_tests() {
    echo
    print_info "Starting test applications..."
    echo "This will start all test applications with hot reload monitoring."
    echo "Press Ctrl+C to stop all applications."
    echo

    read -p "Continue? (y/N): " -n 1 -r
    echo

    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        return
    fi

    npm run dev:test
}

# Clean unused files
cleanup_files() {
    echo
    print_info "Analyzing unused files (dry run)..."
    echo "This will show what files would be removed without actually deleting them."
    echo

    if npm run dev:cleanup; then
        echo
        print_success "Analysis completed. Check the cleanup report for details."
        echo "To actually remove files, run: npm run dev:cleanup:live"
    else
        echo
        print_error "Cleanup analysis failed. Check the logs for details."
    fi

    echo
    read -p "Press Enter to continue..."
}

# Analyze dependencies
analyze_dependencies() {
    echo
    print_info "Analyzing dependencies and code quality..."
    echo "This will analyze the entire codebase for:"
    echo "  - Dependency relationships"
    echo "  - Circular dependencies"
    echo "  - Unused exports"
    echo "  - Dead code"
    echo "  - Bundle optimization opportunities"
    echo

    if npm run dev:analyze; then
        echo
        print_success "Analysis completed! Check the generated reports."
    else
        echo
        print_error "Analysis failed. Check the logs for details."
    fi

    echo
    read -p "Press Enter to continue..."
}

# Check environment status
check_status() {
    echo
    print_info "Checking environment status..."
    echo

    npm run dev:status --verbose

    echo
    read -p "Press Enter to continue..."
}

# Show help
show_help() {
    echo
    print_info "KalxJS Development Tools Help"
    echo
    echo "Available npm scripts:"
    echo "  npm run dev:setup      - Setup local testing environment"
    echo "  npm run dev:test       - Start test applications"
    echo "  npm run dev:cleanup    - Analyze unused files (dry run)"
    echo "  npm run dev:cleanup:live - Remove unused files (live)"
    echo "  npm run dev:analyze    - Analyze dependencies"
    echo "  npm run dev:status     - Check environment status"
    echo
    echo "Direct script access:"
    echo "  npm run local:setup    - Setup local testing"
    echo "  npm run local:test     - Run test orchestrator"
    echo "  npm run local:cleanup  - Clean unused files"
    echo "  npm run local:analyze  - Analyze dependencies"
    echo
    echo "For detailed help on any command:"
    echo "  npm run dev-tools help"
    echo "  npm run dev-tools <command> --help"
    echo
    echo "Documentation:"
    echo "  scripts/README.md      - Development tools documentation"
    echo "  README.md              - Main project documentation"
    echo
    read -p "Press Enter to continue..."
}

# Main function
main() {
    print_header
    check_prerequisites

    while true; do
        show_menu
        read -p "Enter your choice (1-7): " choice

        case $choice in
            1)
                setup_environment
                ;;
            2)
                start_tests
                ;;
            3)
                cleanup_files
                ;;
            4)
                analyze_dependencies
                ;;
            5)
                check_status
                ;;
            6)
                show_help
                ;;
            7)
                echo
                print_info "Thanks for using KalxJS Development Tools!"
                echo
                exit 0
                ;;
            *)
                print_error "Invalid choice. Please try again."
                ;;
        esac
    done
}

# Handle Ctrl+C gracefully
trap 'echo -e "\n\nExiting..."; exit 0' INT

# Run main function
main "$@"