package main

import (
	"fmt"
	"html/template"
	"net/http"
	"os"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/joho/godotenv"
)

func main(){
	godotenv.Load()

	app := chi.NewRouter()
	
	app.Use(middleware.Logger)

	t := template.Must(template.ParseGlob("*.html"))

	fs := http.FileServer(http.Dir("static"))
	app.Handle("/static/*", http.StripPrefix("/static/", fs))

	app.Get("/", func(res http.ResponseWriter, req *http.Request) {
		if err := t.ExecuteTemplate(res, "index.html", nil); err != nil{
			http.Error(res, err.Error(), http.StatusInternalServerError)
		}
	})

	fmt.Println("Running on port:", os.Getenv("PORT"))
	http.ListenAndServe(fmt.Sprintf(":%s", os.Getenv("PORT")), app)
}