# Cartenance Testing Documentation

This document describes the main manual and technical checks used to verify Cartenance against its requirements.

## Automated Build Check

| Test | Steps | Expected Result | Status |
| --- | --- | --- | --- |
| TypeScript and production build | Run `npm run check` | Backend TypeScript build and frontend production build complete successfully | Passed |

## Manual Functional Tests

| Requirement | Test Steps | Expected Result | Status |
| --- | --- | --- | --- |
| User can register | Open the register page, enter email and password, submit the form | A new user account is created and the user is logged in | Passed |
| User can log in | Open the login page, enter valid credentials, submit the form | User is logged in and redirected to the vehicle list | Passed |
| User can add a vehicle | Fill in vehicle name, brand, model, and year, then save | Vehicle appears in the vehicle list | Passed |
| User can open vehicle history | Click the open button for a vehicle | Vehicle-specific maintenance and repair view opens | Passed |
| User can add a maintenance record | Select maintenance type, enter date, kilometers, title, description, and cost, then save | Record appears in the vehicle history | Passed |
| User can add a repair record | Select repair type, enter date, kilometers, title, description, and cost, then save | Record appears in the vehicle history | Passed |
| Repair does not affect next maintenance | Add a repair record with a higher kilometer value than the latest maintenance | Next maintenance estimate remains based on maintenance records only | Passed |
| User can filter records | Select all, maintenance, and repair filters | The list changes according to the selected filter | Passed |
| User can upload a photo | Select an image file for a record | The image appears next to the record | Passed |
| User can open a photo | Click the photo preview or open photo control | The image opens in a larger view or browser tab | Passed |
| User can download a photo | Click the download photo control | The image downloads to the device | Passed |
| Costs are summarized | Add maintenance and repair records with costs | Total costs, maintenance costs, and repair costs are shown separately in euros | Passed |
| User can download PDF report | Click the PDF button in the vehicle view | A PDF report is downloaded | Passed |
| PDF language follows user language | Change the user language and download the PDF again | PDF labels use the selected language | Passed |
| User can change language | Open settings, select Finnish or English, save | Interface language changes | Passed |
| User can change theme | Open settings, select light or dark, save | Interface theme changes | Passed |
| User can delete a record | Click the delete button for a record | The record is removed from the history | Passed |
| User can delete a vehicle | Click the delete button for a vehicle | The vehicle is removed from the list | Passed |

## Validation Summary

The implemented application meets the main goal of the project: a car owner can store vehicle maintenance and repair information in one local application instead of relying only on paper documents or external manufacturer systems.

The most important requirements are fulfilled:

- Vehicle data can be added and viewed.
- Maintenance and repair records can be stored separately.
- Photos can be attached to records.
- Costs are shown in euros and separated by maintenance and repair.
- A PDF report can be generated.
- The application supports Finnish and English.
- The application can be run locally from the Git repository.

## Known Limitations

- The application does not include automatic password recovery.
- The application does not fetch data from external vehicle systems.
- The next maintenance estimate is simplified and does not use manufacturer-specific service schedules.
- The application is intended for local demonstration use, not public cloud deployment.
