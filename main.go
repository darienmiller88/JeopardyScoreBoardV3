package main

import (
	"html/template"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
)

func main(){
	app := chi.NewRouter()
	
	app.Use(middleware.Logger)

	t := template.Must(template.ParseGlob("*.html"))

	app.Get("/", func(res http.ResponseWriter, req *http.Request) {
		if err := t.ExecuteTemplate(res, "index.html", nil); err != nil{
			http.Error(res, err.Error(), http.StatusInternalServerError)
		}
	})

	http.ListenAndServe(":3000", app)
}