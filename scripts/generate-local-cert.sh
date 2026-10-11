#!/bin/sh
set -eu

project_dir="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
cert_dir="$project_dir/certs"

command -v openssl >/dev/null 2>&1 || {
  echo "OpenSSL is required." >&2
  exit 1
}

if [ -e "$cert_dir/localhost.crt" ] || [ -e "$cert_dir/localhost.key" ]; then
  echo "Certificate files already exist; refusing to overwrite them." >&2
  exit 1
fi

umask 077
mkdir -p "$cert_dir"

openssl req \
  -x509 \
  -newkey rsa:2048 \
  -sha256 \
  -nodes \
  -days 365 \
  -keyout "$cert_dir/localhost.key" \
  -out "$cert_dir/localhost.crt" \
  -subj "/CN=localhost" \
  -addext "subjectAltName=DNS:localhost,IP:127.0.0.1,IP:::1" \
  -addext "basicConstraints=critical,CA:FALSE" \
  -addext "keyUsage=critical,digitalSignature,keyEncipherment" \
  -addext "extendedKeyUsage=serverAuth"

chmod 644 "$cert_dir/localhost.crt"

echo "Local certificate created in $cert_dir"