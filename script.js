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

// Auto-save to localStorage with visual confirmation
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

// NFC scan via mobile
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

// Manual input for external USB readers
function handleManualCardInput() {
  const input = document.getElementById("manualCardInput").value.trim();
  if (input.length >= 4) {
    currentCardId = input;
    document.getElementById("cardIdDisplay").innerHTML = `Card ID: <em>${input}</em>`;
  }
}

// Toggle branded company input visibility
function toggleBrandedInput() {
  const category = document.getElementById("category").value;
  document.getElementById("brandedLabel").style.display = category === "General Branded" ? "block" : "none";
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
    brandedCompany: document.getElementById("brandedCompany").value || "",
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
  document.getElementById("brandedCompany").value = "";
  document.getElementById("name").value = "";
  document.getElementById("phone").value = "";
  document.getElementById("address").value = "";
  document.getElementById("brandedLabel").style.display = "none";
  currentCardId = "";
  document.getElementById("cardIdDisplay").innerHTML = `Card ID: <em>None</em>`;
  document.getElementById("manualCardInput").value = "";
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
      <td>${entry.brandedCompany}</td>
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
  document.getElementById("brandedCompany").value = entry.brandedCompany;
  document.getElementById("name").value = entry.name;
  document.getElementById("phone").value = entry.phone;
  document.getElementById("address").value = entry.address;
  toggleBrandedInput();
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

// Load file based on extension
function loadFile(event) {
  const file = event.target.files[0];
  if (!file) return;

  const ext = file.name.split('.').pop().toLowerCase();

  if (ext === 'csv') {
    loadCSV(file);
  } else if (ext === 'json') {
    loadJSON(file);
  } else if (ext === 'xlsx') {
    alert("XLSX support coming soon. Please convert to CSV or JSON for now.");
  } else {
    alert("Unsupported file type.");
  }
}

// Load CSV file
function loadCSV(file) {
  const reader = new FileReader();
  reader.onload = function(e) {
    const text = e.target.result;
    const lines = text.trim().split("\n");
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",");
      const entry = {
        cardId: values[0],
        category: values[1],
        brandedCompany: values[2],
        name: values[3],
        phone: values[4],
        address: values[5]
      };
      entries.push(entry);
    }
    autoSave();
    updatePreview();
    document.getElementById("uploadStatus").textContent = `Loaded ${lines.length - 1} entries from CSV.`;
  };
  reader.readAsText(file);
}

// Load JSON file
function loadJSON(file) {
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = JSON.parse(e.target.result);
      if (Array.isArray(data)) {
        data.forEach(entry => {
          entries.push({
            cardId: entry.cardId || "",
            category: entry.category || "",
            brandedCompany: entry.brandedCompany || "",
            name: entry.name || "",
            phone: entry.phone || "",
            address: entry.address || ""
          });
        });
        autoSave();
        updatePreview();
        document.getElementById("uploadStatus").textContent = `Loaded ${data.length} entries from JSON.`;
      } else {
        alert("Invalid JSON format. Expected an array of entries.");
      }
    } catch (err) {
      alert("Failed to parse JSON: " + err.message);
    }
  };
  reader.readAsText(file);
}

// Export entries to CSV
function exportCSV() {
  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, "-");
  const filename = `taab_scan_log_${timestamp}.csv`;
  const header = ["Card ID", "Category", "Branded Company", "Name", "Phone", "Address"];
  const rows = entries.map(e => [e.cardId, e.category, e.brandedCompany, e.name, e.phone, e.address]);
  const csvContent = [header, ...rows].map(r => r.join(",")).join("\n");

  const blob = new Blob([csvContent], { type: "text/csv" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}

// Clear saved data
function clearSavedData() {
  localStorage.removeItem("taabEntries");
  entries = [];
  updatePreview();
  document.getElementById("status").textContent = "Auto-saved entries cleared.";
  showAutoSaveToast();
}

