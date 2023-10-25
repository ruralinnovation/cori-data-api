
cd packages/python-lambdas/dependency-layer/

mkdir -p dist

poetry export -f requirements.txt --without-hashes -o dist/requirements.txt

poetry run pip install . -r requirements.txt -t dist

cd dist \
  && find . -name "*.pyc" -delete \
  && zip -r ../dependency-layer . \
  && cd ..

rm -rf dist
