let entries = [];
let currentCardId = "";
let editingIndex = null;

// Restore saved entries on page load
window.addEventListener("DOMContentLoaded", () => {
  const saved = localStorage.getItem("taabEntries");
  if (saved) {
    entries = JSON.parse(saved);
    updatePreview();
    document.getElementById("status").textContent = `Restored ${entries.length} saved entries.`;
  }
});

// Auto-save to localStorage
function autoSave() {
  localStorage.setItem("taabEntries", JSON.stringify(entries));
  showAutoSaveToast();
}

function showAutoSaveToast() {
  const toast = document.getElementById("autosaveToast");
  toast.classList.add("show");
  setTimeout(() => {
    toast.classList.remove("show");
  }, 1500);
}


// NFC Scan
async function scanCard() {
  if ('NDEFReader' in window) {
    try {
      const reader = new NDEFReader();
      await reader.scan();
      reader.onreading = event => {
        const id = event.serialNumber || "Unknown";
        currentCardId = id;
        document.getElementById("cardIdDisplay").innerHTML = `Card ID: <em>${id}</em>`;
      };
    } catch (error) {
      alert("NFC scan failed: " + error);
    }
  } else {
    alert("Web NFC not supported on this device.");
  }
}

// Toggle company input visibility
function toggleCompanyInput() {
  const category = document.getElementById("category").value;
  document.getElementById("companyLabel").style.display = category === "General Branded" ? "block" : "none";
}

// Save or update entry
function saveEntry() {
  if (!currentCardId) {
    alert("Please scan a card first.");
    return;
  }

  const entry = {
    cardId: currentCardId,
    category: document.getElementById("category").value,
    company: document.getElementById("company").value || "",
    name: document.getElementById("name").value || "",
    phone: document.getElementById("phone").value || "",
    address: document.getElementById("address").value || ""
  };

  if (editingIndex !== null) {
    entries[editingIndex] = entry;
    editingIndex = null;
    document.querySelector("button[onclick='saveEntry()']").textContent = "💾 Save Entry";
  } else {
    entries.push(entry);
  }

  autoSave();
  clearForm();
  updatePreview();
  document.getElementById("status").textContent = `Saved ${entries.length} entries.`;
}

// Clear form fields
function clearForm() {
  document.getElementById("category").value = "General";
  document.getElementById("company").value = "";
  document.getElementById("name").value = "";
  document.getElementById("phone").value = "";
  document.getElementById("address").value = "";
  document.getElementById("companyLabel").style.display = "none";
  currentCardId = "";
  document.getElementById("cardIdDisplay").innerHTML = `Card ID: <em>None</em>`;
}

// Update preview table
function updatePreview() {
  const tbody = document.querySelector("#previewTable tbody");
  tbody.innerHTML = "";

  entries.forEach((entry, index) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${entry.cardId}</td>
      <td>${entry.category}</td>
      <td>${entry.company}</td>
      <td>${entry.name}</td>
      <td>${entry.phone}</td>
      <td>${entry.address}</td>
      <td>
        <button onclick="editEntry(${index})">✏️</button>
        <button onclick="deleteEntry(${index})">🗑️</button>
      </td>
    `;
    tbody.appendChild(row);
  });
}

// Edit entry
function editEntry(index) {
  const entry = entries[index];
  currentCardId = entry.cardId;
  document.getElementById("cardIdDisplay").innerHTML = `Card ID: <em>${entry.cardId}</em>`;
  document.getElementById("category").value = entry.category;
  document.getElementById("company").value = entry.company;
  document.getElementById("name").value = entry.name;
  document.getElementById("phone").value = entry.phone;
  document.getElementById("address").value = entry.address;
  toggleCompanyInput();
  editingIndex = index;
  document.querySelector("button[onclick='saveEntry()']").textContent = "✅ Update Entry";
}

// Delete entry
function deleteEntry(index) {
  if (confirm("Are you sure you want to delete this entry?")) {
    entries.splice(index, 1);
    autoSave();
    updatePreview();
    document.getElementById("status").textContent = `Saved ${entries.length} entries.`;
  }
}

// Load CSV file
function loadCSV(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    const text = e.target.result;
    const lines = text.trim().split("\n");
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",");
      const entry = {
        cardId: values[0],
        category: values[1],
        company: values[2],
        name: values[3],
        phone: values[4],
        address: values[5]
      };
      entries.push(entry);
    }
    autoSave();
    updatePreview();
    document.getElementById("uploadStatus").textContent = `Loaded ${lines.length - 1} entries from file.`;
  };
  reader.readAsText(file);
}

// Export CSV file
function exportCSV() {
  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, "-");
  const filename = `taab_scan_log_${timestamp}.csv`;
  const header = ["Card ID", "Category", "Company", "Name", "Phone", "Address"];
  const rows = entries.map(e => [e.cardId, e.category, e.company, e.name, e.phone, e.address]);
  const csvContent = [header, ...rows].map(r => r.join(",")).join("\n");

  const blob = new Blob([csvContent], { type: "text/csv" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}

// Optional: Clear saved data
function clearSavedData() {
  localStorage.removeItem("taabEntries");
  entries = [];
  updatePreview();
  document.getElementById("status").textContent = "Auto-saved entries cleared.";
}
