# GET routes
* **GET** /

# POST routes
* **POST** /user/register
	- `username`: username (string) 
	- `email`: email (string) 
	- `password`: password (string) 

* **POST** /user/login
	- `username`: username (string)  | undefined
	- `email`: email (string)  | undefined
	- `password`: password (string) 

* **POST** /user/verify
	- `username`: username (string) 
	- `email`: email (string) 
	- `otp`: otp (string) 

