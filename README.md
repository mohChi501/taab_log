# TAAB Card Scanner

TAAB Card Scanner is a web-based NFC card scanning application designed for transit and micropayment cards. It allows users to scan card IDs using Web NFC, categorize them, enter owner details, update existing records from CSV files, and export the scanned data to a new CSV file.

## 🚀 Features

- Scan NFC-enabled transit and micropayment cards using Web NFC
- Categorize cards as General, General Branded, Student, or Golden
- Input branded company name for General Branded cards
- Add optional owner details: name, phone number, and address
- Upload existing CSV files to update scanned records
- Export all scanned entries to a timestamped CSV file
- Supports multiple scans and data logging

## 📋 Usage Instructions

1. Open the app in **Chrome for Android** (Web NFC is supported only on this browser)
2. Tap **Scan NFC Card** to read the card ID
3. Select the **Category** and fill in additional details as needed
4. Tap **Save Entry** to log the scanned card
5. Optionally, upload an existing CSV file to update records
6. Tap **Export CSV** to download the log with a filename like `taab_scan_log_YYYY-MM-DD_HH-MM-SS.csv`

## 🛠 Technologies Used

- HTML5
- JavaScript (Web NFC API)
- CSV file handling via Blob and FileReader

## 🌐 Hosting with GitHub Pages

To host this app using GitHub Pages:

1. Create a GitHub repository (e.g., `taab-card-scanner`)
2. Upload the HTML file and rename it to `index.html`
3. Go to **Settings > Pages**
4. Under **Source**, select `main` branch and `/root`
5. Save and access your app at `https://<your-username>.github.io/taab-card-scanner/`

## 📱 Notes

- Web NFC requires HTTPS and is supported only on Chrome for Android
- External NFC readers are not supported in this web version

## 📄 License

This project is open-source and available under the MIT License.
