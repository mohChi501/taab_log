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

// Show/hide extra fields based on category
function toggleExtraFields() {
  const category = document.getElementById("category").value;

  const brandedInstitutionLabel = document.getElementById("brandedInstitutionLabel");
  const studentIdLabel = document.getElementById("studentIdLabel");
  const studentImageLabel = document.getElementById("studentImageLabel");

  // Hide all by default
  brandedInstitutionLabel.style.display = "none";
  studentIdLabel.style.display = "none";
  studentImageLabel.style.display = "none";

  if (category === "General Branded" || category === "Student") {
    brandedInstitutionLabel.style.display = "block";
  }

  if (category === "Student ID") {
    brandedInstitutionLabel.style.display = "block";
    studentIdLabel.style.display = "block";
    studentImageLabel.style.display = "block";
  }
}

// Save or update entry
function saveEntry() {
  if (!currentCardId) {
    alert("Please scan a card first.");
    return;
  }

  const category = document.getElementById("category").value;
  const brandedInstitution = document.getElementById("brandedInstitution").value || "";
  const studentId = document.getElementById("studentIdNo").value || "";
  const name = document.getElementById("name").value || "";
  const phone = document.getElementById("phone").value || "";
  const address = document.getElementById("address").value || "";
  const imageFile = document.getElementById("studentImage").files[0] || null;

  // Conditional validation
  if (
    (category === "General Branded" || category === "Student" || category === "Student ID") &&
    !brandedInstitution.trim()
  ) {
    alert("Please enter the Branded Institution name.");
    return;
  }

  if (category === "Student ID" && !studentId.trim()) {
    alert("Please enter the Student ID No.");
    return;
  }

  // Handle optional image
  if (imageFile) {
    const reader = new FileReader();
    reader.onload = function(e) {
      saveEntryData(category, brandedInstitution, studentId, name, phone, address, e.target.result);
    };
    reader.readAsDataURL(imageFile);
  } else {
    saveEntryData(category, brandedInstitution, studentId, name, phone, address, "");
  }
}

function saveEntryData(category, brandedInstitution, studentId, name, phone, address, imageData) {
  const entry = {
    cardId: currentCardId,
    category,
    brandedInstitution,
    studentId,
    name,
    phone,
    address,
    timestamp: new Date().toISOString(),
    image: imageData
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
  document.getElementById("brandedInstitution").value = "";
  document.getElementById("studentIdNo").value = "";
  document.getElementById("studentImage").value = "";
  document.getElementById("name").value = "";
  document.getElementById("phone").value = "";
  document.getElementById("address").value = "";
  toggleExtraFields();
  currentCardId = "";
  document.getElementById("cardIdDisplay").innerHTML = `Card ID: <em>None</em>`;
  document.getElementById("manualCardInput").value = "";
}

// Update preview table
function updatePreview(filtered = null) {
  const tbody = document.querySelector("#previewTable tbody");
  tbody.innerHTML = "";

  (filtered || entries).forEach((entry, index) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${entry.cardId}</td>
      <td>${entry.category}</td>
      <td>${entry.brandedInstitution}</td>
      <td>${entry.studentId || ""}</td>
      <td>${entry.name}</td>
      <td>${entry.phone}</td>
      <td>${entry.address}</td>
      <td>${new Date(entry.timestamp).toLocaleString()}</td>
      <td>${entry.image ? `<img src="${entry.image}" alt="Image" style="width:40px;height:40px;object-fit:cover;">` : ""}</td>
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
  document.getElementById("brandedInstitution").value = entry.brandedInstitution;
  document.getElementById("studentIdNo").value = entry.studentId;
  document.getElementById("name").value = entry.name;
  document.getElementById("phone").value = entry.phone;
  document.getElementById("address").value = entry.address;
  toggleExtraFields();
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
        cardId: values[0] || "",
        category: values[1] || "",
        brandedInstitution: values[2] || "",
        studentId: values[3] || "",
        name: values[4] || "",
        phone: values[5] || "",
        address: values[6] || "",
        timestamp: values[7] || new Date().toISOString(),
        image: values[8] || "" // may be empty
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
            brandedInstitution: entry.brandedInstitution || "",
            studentId: entry.studentId || "",
            name: entry.name || "",
            phone: entry.phone || "",
            address: entry.address || "",
            timestamp: entry.timestamp || new Date().toISOString(),
            image: entry.image || ""
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
  const includeImages = document.getElementById("includeImagesExport").checked;
  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, "-");
  const filename = `taab_scan_log_${timestamp}.csv`;

  const header = ["Card ID", "Category", "Branded Institution", "Student ID No.", "Name", "Phone", "Address", "Timestamp"];
  if (includeImages) header.push("Image");

  const rows = entries.map(e => {
    const row = [e.cardId, e.category, e.brandedInstitution, e.studentId, e.name, e.phone, e.address, e.timestamp];
    if (includeImages) row.push(e.image);
    return row;
  });

  const csvContent = [header, ...rows].map(r => r.join(",")).join("\n");

  const blob = new Blob([csvContent], { type: "text/csv" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}

// Export entries to JSON
function exportJSON() {
  const includeImages = document.getElementById("includeImagesExport").checked;
  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, "-");
  const filename = `taab_scan_log_${timestamp}.json`;

  const data = entries.map(e => {
    const obj = {
      cardId: e.cardId,
      category: e.category,
      brandedInstitution: e.brandedInstitution,
      studentId: e.studentId,
      name: e.name,
      phone: e.phone,
      address: e.address,
      timestamp: e.timestamp
    };
    if (includeImages) obj.image = e.image;
    return obj;
  });

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}

// Search/filter entries
function filterEntries() {
  const query = document.getElementById("searchInput").value.toLowerCase();
  const filtered = entries.filter(e =>
    e.cardId.toLowerCase().includes(query) ||
    e.category.toLowerCase().includes(query) ||
    e.brandedInstitution.toLowerCase().includes(query) ||
    (e.studentId && e.studentId.toLowerCase().includes(query)) ||
    e.name.toLowerCase().includes(query) ||
    e.phone.toLowerCase().includes(query) ||
    e.address.toLowerCase().includes(query) ||
    (e.timestamp && e.timestamp.toLowerCase().includes(query))
  );
  updatePreview(filtered);
}

// Clear saved data
function clearSavedData() {
  if (confirm("Are you sure you want to clear all auto-saved entries?")) {
    localStorage.removeItem("taabEntries");
    entries = [];
    updatePreview();
    document.getElementById("status").textContent = "Auto-saved entries cleared.";
    showAutoSaveToast();
  }
}
