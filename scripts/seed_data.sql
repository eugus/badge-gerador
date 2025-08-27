-- Inserir dados de exemplo
USE badge_generator;

-- Inserir estudantes de exemplo
INSERT INTO students (name, email, registration, course) VALUES
('João Silva', 'joao.silva@email.com', '2023001', 'Ciência da Computação'),
('Maria Santos', 'maria.santos@email.com', '2023002', 'Engenharia de Software'),
('Pedro Oliveira', 'pedro.oliveira@email.com', '2023003', 'Sistemas de Informação'),
('Ana Costa', 'ana.costa@email.com', '2023004', 'Ciência da Computação'),
('Carlos Ferreira', 'carlos.ferreira@email.com', '2023005', 'Engenharia de Software');

-- Inserir badges de exemplo
INSERT INTO badges (name, description, category, is_active) VALUES
('Primeiro Projeto', 'Concluiu seu primeiro projeto com sucesso', 'Projetos', TRUE),
('Colaborador Ativo', 'Participou ativamente de projetos em equipe', 'Colaboração', TRUE),
('Inovador', 'Apresentou soluções criativas e inovadoras', 'Inovação', TRUE),
('Mentor', 'Ajudou outros estudantes em seus projetos', 'Mentoria', TRUE),
('Apresentador Expert', 'Fez apresentações excepcionais', 'Apresentação', TRUE),
('Código Limpo', 'Demonstrou excelência em qualidade de código', 'Programação', TRUE),
('Líder de Equipe', 'Liderou equipe com sucesso', 'Liderança', TRUE),
('Pesquisador', 'Conduziu pesquisas relevantes na área', 'Pesquisa', TRUE);

-- Inserir algumas atribuições de exemplo
INSERT INTO badge_assignments (student_id, badge_id, achievement_reason, email_sent) VALUES
(1, 1, 'Concluiu o projeto final da disciplina de Programação I com nota máxima', TRUE),
(1, 6, 'Código bem estruturado e documentado no projeto final', FALSE),
(2, 2, 'Participação ativa no projeto integrador do semestre', TRUE),
(2, 4, 'Ajudou colegas com dificuldades em programação', FALSE),
(3, 1, 'Primeiro projeto entregue dentro do prazo e com qualidade', TRUE),
(4, 3, 'Proposta inovadora para solução de problema real', FALSE),
(5, 7, 'Liderou equipe de 5 pessoas no projeto final', TRUE);
