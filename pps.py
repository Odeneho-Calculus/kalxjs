import os
from pathlib import Path
from fpdf import FPDF, XPos, YPos
import webbrowser

def print_directory_tree(directory, prefix=""):
    """
    Recursively prints the directory tree structure.

    :param directory: The root directory to start traversal.
    :param prefix: The prefix string used for indentation and symbols.
    :return: A list of lines representing the directory tree structure.
    """
    output_lines = []
    entries = sorted(os.listdir(directory))
    files = [entry for entry in entries if os.path.isfile(os.path.join(directory, entry))]
    dirs = [entry for entry in entries if os.path.isdir(os.path.join(directory, entry))]

    for i, subdir in enumerate(dirs):
        is_last = i == len(dirs) - 1
        # Replace special characters with ASCII equivalents
        symbol = "`-- " if is_last else "|-- "
        output_lines.append(prefix + symbol + subdir + "/")
        new_prefix = prefix + ("    " if is_last else "|   ")
        output_lines.extend(print_directory_tree(os.path.join(directory, subdir), new_prefix))

    for i, file in enumerate(files):
        is_last = i == len(files) - 1
        # Replace special characters with ASCII equivalents
        symbol = "`-- " if is_last else "|-- "
        output_lines.append(prefix + symbol + file)

    return output_lines

def save_to_text_file(lines, filepath):
    """
    Saves the directory tree structure to a text file.

    :param lines: List of lines representing the directory tree.
    :param filepath: Path to the output text file.
    """
    with open(filepath, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))

def save_to_pdf(lines, filepath):
    """
    Saves the directory tree structure to a PDF file using the default font.

    :param lines: List of lines representing the directory tree.
    :param filepath: Path to the output PDF file.
    """
    pdf = FPDF()
    pdf.add_page()
    pdf.set_auto_page_break(auto=True, margin=15)
    pdf.set_font("Arial", size=12)  # Use the default Arial font

    for line in lines:
        pdf.cell(0, 10, text=line, new_x=XPos.LMARGIN, new_y=YPos.NEXT)

    pdf.output(filepath)

def main():
    # Get the root directory of the project
    root_directory = Path.cwd()
    project_name = root_directory.name

    # Generate the directory tree structure
    print(f"Project Structure for '{project_name}':\n")
    tree_lines = print_directory_tree(root_directory)
    print("\n".join(tree_lines))

    # Ask the user for the desired output format
    choice = input("\nDo you want to save this structure to (P)DF, (T)ext, or (C)ancel? [P/T/C]: ").strip().lower()

    if choice not in ["p", "t"]:
        print("Operation canceled.")
        return

    # Define the default save location
    documents_dir = Path.home() / "Documents" / "pps"
    documents_dir.mkdir(parents=True, exist_ok=True)

    # Define the file name and path
    file_extension = "pdf" if choice == "p" else "txt"
    file_path = documents_dir / f"{project_name}.{file_extension}"

    # Save the file
    try:
        if choice == "p":
            save_to_pdf(tree_lines, file_path)
        elif choice == "t":
            save_to_text_file(tree_lines, file_path)
    except Exception as e:
        print(f"An error occurred while saving the file: {e}")
        return

    print(f"\nFile saved successfully at: {file_path}")

    # Ask the user if they want to open the file
    open_choice = input("Do you want to open the file? [Y/N]: ").strip().lower()
    if open_choice == "y":
        webbrowser.open(file_path)

if __name__ == "__main__":
    main()