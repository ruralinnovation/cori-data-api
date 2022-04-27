
cd python-microservices/lambda-dependency-layer

poetry export -f requirements.txt --without-hashes -o requirements.txt

poetry run pip install . -r requirements.txt -t dist

cd dist

find . -name "*.pyc" -delete

zip -r ../lambda-dependency-layer .

cd ..

rm -rf dist

rm requirements.txt
