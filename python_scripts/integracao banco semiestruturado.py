import psycopg2
import pandas as pd
import xml.etree.ElementTree as ET

# conexão com o PostgreSQL
import psycopg
conn = psycopg.connect(
    host="localhost",
    dbname="banco semiestruturado",
    user="postgres",
    password="pedrogato1210"
)


# lendo tabela Peca
query_peca = "SELECT * FROM Peca;"
df_peca = pd.read_sql(query_peca, conn)

print("\n=== Tabela PECA (PostgreSQL) ===")
print(df_peca)

# leitura do XML Fornecimento.xml
xml_path = r"C:\Users\Pedro\Downloads\Fornecimento.xml" # caminho enviado

tree = ET.parse(xml_path)
root = tree.getroot()

dados_xml = []

for row in root.findall("row"):
    dados_xml.append({
        "codigo": int(row.find("codigo").text),
        "cod_fornec": int(row.find("cod_fornec").text),
        "cod_peca": int(row.find("cod_peca").text),
        "cod_proj": int(row.find("cod_proj").text),
        "quantidade": int(row.find("quantidade").text),
        "valor": float(row.find("valor").text)
    })

df_xml = pd.DataFrame(dados_xml)

print("\n=== XML FORNECIMENTO (lido do arquivo) ===")
print(df_xml)

# junção entre peca + xml
df_join = df_peca.merge(df_xml, left_on="cod_peca", right_on="cod_peca", how="inner")

print("\n=== JUNÇÃO FINAL ENTRE PECA + XML ===")
print(df_join)

# encerrar conexão
conn.close()
