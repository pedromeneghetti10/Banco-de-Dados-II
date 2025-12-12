import psycopg2
import redis

# PostgreSQL
pg_conn = psycopg2.connect(
    dbname="conexaoredis",
    user="postgres",
    password="pedrogato1210",
    host="localhost",
    port=5432
)

# Redis
redis_client = redis.Redis(
    host="localhost",
    port=6379,
    db=0,
    decode_responses=True  
)

# POSTGRESQL – CRUD
def create_table():
    cur = pg_conn.cursor()
    cur.execute("""
        CREATE TABLE IF NOT EXISTS pessoas (
            id SERIAL PRIMARY KEY,
            nome VARCHAR(100)
        );
    """)
    pg_conn.commit()
    cur.close()


def pg_create(nome):
    cur = pg_conn.cursor()
    cur.execute("INSERT INTO pessoas (nome) VALUES (%s)", (nome,))
    pg_conn.commit()
    cur.close()


def pg_read():
    cur = pg_conn.cursor()
    cur.execute("SELECT id, nome FROM pessoas ORDER BY id")
    rows = cur.fetchall()
    cur.close()
    return rows


def pg_update(id_pessoa, novo_nome):
    cur = pg_conn.cursor()
    cur.execute("UPDATE pessoas SET nome = %s WHERE id = %s", (novo_nome, id_pessoa))
    pg_conn.commit()
    cur.close()


def pg_delete(id_pessoa):
    cur = pg_conn.cursor()
    cur.execute("DELETE FROM pessoas WHERE id = %s", (id_pessoa,))
    pg_conn.commit()
    cur.close()


# REDIS – CRUD
def redis_create(chave, valor):
    redis_client.set(chave, valor)


def redis_read(chave):
    return redis_client.get(chave)


def redis_update(chave, novo_valor):
    redis_client.set(chave, novo_valor)


def redis_delete(chave):
    redis_client.delete(chave)

# TESTES DOS DOIS BANCOS
def testar_postgres():
    print("\nTESTANDO POSTGRES\n")
    create_table()

    cur = pg_conn.cursor()
    cur.execute("TRUNCATE TABLE pessoas RESTART IDENTITY;")
    pg_conn.commit()
    cur.close()

    print("Inserindo dados\n")
    pg_create("Maria")
    pg_create("João")
    pg_create("Carla")

    print("Listando dados:")
    for row in pg_read():
        print(row)

    print("\nAtualizando id = 1 para Maria Silva")
    pg_update(1, "Maria Silva")

    print("\nListando novamente:")
    for row in pg_read():
        print(row)

    print("\nDeletando id=2\n")
    pg_delete(2)

    print("Final:")
    for row in pg_read():
        print(row)

    print("\n--------------------------------------")

def testar_redis():
    print("\nTESTANDO REDIS")

    print("\nCriando chave")
    redis_create("user:1", "Maria")

    print("\nLendo:", redis_read("user:1"))

    print("\nAtualizando para Maria Silva")
    redis_update("user:1", "Maria Silva")

    print("\nLendo:", redis_read("user:1"))

    print("\nDeletando chave")
    redis_delete("user:1")

    print("\nLendo após deletar:", redis_read("user:1"))


if __name__ == "__main__":
    testar_postgres()
    testar_redis()
    pg_conn.close()
