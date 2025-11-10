
import json
import requests
import tkinter as tk
from tkinter import filedialog, messagebox, Text
from ttkbootstrap import Style
from ttkbootstrap.widgets import Button, Frame, Label, Entry

# ───── CONFIG ─────
BIN_URL = "https://api.jsonbin.io/v3/b/685483278a456b7966b15571"
HEADERS = {
    "Content-Type": "application/json",
    "X-Master-Key": "$2a$10$565nuvZV/Ei9YWxi8ccHeOlOdGnL8XpJMbFGn.ufl.I3QDw.cplBW"
}

def fetch_json():
    try:
        r = requests.get(BIN_URL, headers=HEADERS, timeout=10)
        if r.status_code == 200:
            data = r.json()
            raw = json.dumps(data["record"], indent=4)
            text_area.delete("1.0", tk.END)
            text_area.insert("1.0", raw)
        else:
            messagebox.showerror("Fetch Failed", f"Status: {r.status_code}\n{r.text[:300]}")
    except requests.RequestException as e:
        messagebox.showerror("Network Error", str(e))

def upload_json():
    raw = text_area.get("1.0", tk.END).strip()
    if not raw:
        messagebox.showwarning("No Data", "Please paste or load JSON first.")
        return
    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError as e:
        messagebox.showerror("Invalid JSON", f"Error parsing JSON:\n{e}")
        return

    try:
        r = requests.put(BIN_URL, headers=HEADERS, json=parsed, timeout=15)
        if r.status_code == 200:
            messagebox.showinfo("Success", "✅ JSONBin updated.")
        else:
            messagebox.showerror("Upload Failed", f"HTTP {r.status_code}\n{r.text[:300]}")
    except requests.RequestException as e:
        messagebox.showerror("Upload Failed", str(e))

def load_from_file():
    file_path = filedialog.askopenfilename(filetypes=[("JSON Files", "*.json"), ("All Files", "*.*")])
    if file_path:
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                text_area.delete("1.0", tk.END)
                text_area.insert("1.0", json.dumps(data, indent=4))
        except Exception as e:
            messagebox.showerror("File Error", str(e))

# ───── GUI SETUP ─────
style = Style("darkly")
root = style.master
root.title("VRC_Character_Updater")
root.geometry("800x600")
root.minsize(600, 450)

# Header Frame
header_frame = Frame(root, padding=(20, 10))
header_frame.pack(fill=tk.X)

Label(header_frame, text="VRC Character Updater", font=("Segoe UI", 18, "bold"), bootstyle="info").pack(side=tk.LEFT)
Button(header_frame, text="Reload JSON", command=fetch_json, bootstyle="secondary-outline").pack(side=tk.RIGHT, padx=10)

# Text Area
text_area = Text(root, wrap=tk.WORD, font=("Consolas", 11), height=25, borderwidth=0, relief="flat")
text_area.pack(fill=tk.BOTH, expand=True, padx=20, pady=(0, 10))

# Button Frame
btn_frame = Frame(root, padding=10)
btn_frame.pack(fill=tk.X)

Button(btn_frame, text="📂 Load from File", bootstyle="warning-outline", command=load_from_file, width=20).pack(side=tk.LEFT, padx=10)
Button(btn_frame, text="⬆ Upload to JSONBin", bootstyle="success", command=upload_json, width=25).pack(side=tk.RIGHT, padx=10)

fetch_json()
root.mainloop()
