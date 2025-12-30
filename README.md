# 🛠️ IKEA Assembly Calculator

A mobile application for furniture assembly professionals, built with **React Native (Expo)**.
The app allows for quick calculation of IKEA furniture assembly costs and time using item article numbers or project design codes (powered by the TaskRabbit API).

## 📸 Screenshots

 
<img src="./assets/Screen1.jpg" width="300" alt="App Screenshot" />


## ✨ Key Features

### 🔍 Search & Calculation
* **Search by Article (ID):** Input a single ID or a list of IDs (e.g., `104.878.40`). Supports input separated by spaces or new lines.
* **Search by Design Code:** Support for IKEA project codes (e.g., `Y95DTF`), automatically loading the entire list of fittings and furniture.
* **Automatic Calculation:**
    * **Price:** Retrieved directly from the service API (TaskRabbit).
    * **Time:** Base assembly time multiplied by a configurable coefficient (Work Index).

<img src="./assets/Screen2.jpg" width="300" alt="App Screenshot" />

### ⚙️ Settings & Modes
* **Offline First:** Smart caching system. If an item has been loaded previously, it opens instantly from local storage without network requests.
* **Developer Mode:** Built-in "Live Console" directly in the UI to track API requests, errors, and responses.
* **Flexible Parameters:**
    * Toggle time coefficient (e.g., `x1.3`).
    * Toggle minimum order value.

### 💾 History
* All calculations are saved locally.
* View details of past calculations (item list, prices, total time).
* Option to clear history.

<img src="./assets/Screen3.jpg" width="300" alt="App Screenshot" />

## 🛠️ Tech Stack

* **Framework:** React Native (Expo SDK 52+)
* **Language:** TypeScript
* **Storage:** AsyncStorage (local storage for settings and cache)
* **Build System:** EAS (Expo Application Services)


⚠️ Disclaimer
This application uses public TaskRabbit/IKEA APIs to retrieve product information. This app is not an official IKEA or TaskRabbit product. Use at your own discretion.