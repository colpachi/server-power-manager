# Server Power Manager

The Server Power Manager is a web application designed to manage the scheduling of power on and power off operations for servers within a network environment. This tool allows users to set specific times for these operations and manage access credentials, aiming to facilitate the administration of multiple servers. Machines behind a VPN, as long as they are accessible by the host of this application, can be reached. SPM uses the IPMI protocol to send power on and off commands.

## Note for Dell Servers

Use the IP, username, and password of the iDRAC.

## Features

- **Server Management**: Add and manage multiple servers with detailed information such as name, IP, user credentials, and password.
- **Power On/Off Scheduling**: Configure specific times to automatically power servers on and off.
- **Intuitive User Interface**: Simple and clear interface for easy navigation and management.
- **Data Persistence**: Schedules and server configurations are saved in a SQLite database, ensuring data is not lost between sessions.

## Technologies Used

- **Frontend**: HTML, CSS, JavaScript (with jQuery)
- **Backend**: Node.js
- **Database**: SQLite
- **Web Server**: Express

## Prerequisites

Before starting, make sure you have Node.js installed on your machine. You can download and install Node.js from the following link: [Download Node.js](https://nodejs.org/)

## Project Setup

### Cloning the Repository

First, clone the project repository to your local machine using Git:

```bash
git clone https://github.com/colpachi/server-power-manager.git
cd server-power-manager
cd app
```

### Installing Dependencies

Within the project directory, run the following command to install all necessary dependencies:

```bash
npm install
```

This will install all the dependencies listed in the package.json file.

### Database Configuration

The application uses SQLite to store data. Make sure the data directory exists in the root of the project to store the database file. If it does not exist, create it:

```bash
mkdir data
```

### Running the Application

To start the server, run:

```bash
npm start
```

### Building the Application

If you build the application in a non-unix environment (Windows), delete the node_modules directory before executing the build.
This is due to dependency inconsistencies between these environments.

In the Dockerfile directory:
```bash
docker-compose up --build
```

After starting the server, you can access the application through a browser at the following address:
```
http://localhost:5000
```

## Using the Application

After accessing the application, you will be able to:

- Fill in the server details, including name, IP, username, password, and times for powering on and off.
- Save the settings, which will be persisted in the SQLite database.

## Contributing

Contributions are always welcome. To contribute to the project, fork the repository, create a branch for your modifications, and submit a pull request.
