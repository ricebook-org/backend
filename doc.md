# GET routes
* **GET** /

* **GET** /docs

* **GET** /user/:id/profile/picture

* **GET** /user/posts

* **GET** /user/post/:id

* **GET** /user/post/:id/image

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

* **POST** /user/:id/profile/picture

* **POST** /user/posts
	- `title`: string
	- `description`: string
	- `tags`: string

